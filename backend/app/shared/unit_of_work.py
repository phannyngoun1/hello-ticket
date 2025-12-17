"""
Unit of Work pattern implementation for transaction management
"""
import logging
from typing import Protocol, Optional, TypeVar, Generic
from contextlib import asynccontextmanager
from sqlmodel import Session
from app.infrastructure.shared.database.connection import get_session_sync, engine

logger = logging.getLogger(__name__)

T = TypeVar('T')


class Repository(Protocol, Generic[T]):
    """Protocol for repositories that can be used in Unit of Work"""
    pass


class UnitOfWork:
    """
    Unit of Work pattern for managing transactions across multiple repositories.
    
    Ensures atomic operations - either all changes commit or all rollback.
    """
    
    def __init__(self, session: Optional[Session] = None):
        """
        Initialize Unit of Work
        
        Args:
            session: Optional existing session. If None, creates new session.
        """
        self._session = session or Session(engine)
        self._repositories: dict[str, Repository] = {}
        self._committed = False
        self._rolled_back = False
    
    @property
    def session(self) -> Session:
        """Get the current session"""
        return self._session
    
    def register_repository(self, name: str, repository: Repository) -> None:
        """
        Register a repository to use this Unit of Work's session
        
        Args:
            name: Repository name (e.g., 'tracking', 'balance')
            repository: Repository instance
        """
        # Set the session on the repository if it supports it
        if hasattr(repository, '_session_factory'):
            # Store original session factory and replace with this session
            if not hasattr(repository, '_original_session_factory'):
                repository._original_session_factory = repository._session_factory
            
            # Create a context manager that returns the same session
            def session_factory():
                class SessionContext:
                    def __init__(self, session):
                        self.session = session
                    
                    def __enter__(self):
                        return self.session
                    
                    def __exit__(self, *args):
                        pass  # Don't close, Unit of Work manages lifecycle
                
                return SessionContext(self._session)
            
            repository._session_factory = session_factory
        
        # Also set session directly if repository has _session attribute
        if hasattr(repository, '_session'):
            if not hasattr(repository, '_original_session'):
                repository._original_session = repository._session
            repository._session = self._session
        
        self._repositories[name] = repository
        logger.debug(f"Registered repository '{name}' with Unit of Work")
    
    def get_repository(self, name: str) -> Optional[Repository]:
        """Get a registered repository by name"""
        return self._repositories.get(name)
    
    def commit(self) -> None:
        """Commit all changes in this Unit of Work"""
        if self._committed:
            logger.warning("Unit of Work already committed")
            return
        
        if self._rolled_back:
            raise RuntimeError("Cannot commit after rollback")
        
        try:
            self._session.commit()
            self._committed = True
            logger.info("Unit of Work committed successfully")
        except Exception as e:
            logger.error(f"Error committing Unit of Work: {str(e)}", exc_info=True)
            self.rollback()
            raise
    
    def rollback(self) -> None:
        """Rollback all changes in this Unit of Work"""
        if self._rolled_back:
            logger.warning("Unit of Work already rolled back")
            return
        
        try:
            self._session.rollback()
            self._rolled_back = True
            logger.info("Unit of Work rolled back")
        except Exception as e:
            logger.error(f"Error rolling back Unit of Work: {str(e)}", exc_info=True)
            raise
    
    def close(self) -> None:
        """Close the session"""
        if not self._committed and not self._rolled_back:
            logger.warning("Unit of Work closed without commit or rollback - auto-rolling back")
            self.rollback()
        
        # Restore original session factories on repositories
        for name, repo in self._repositories.items():
            if hasattr(repo, '_original_session_factory'):
                repo._session_factory = repo._original_session_factory
                delattr(repo, '_original_session_factory')
            if hasattr(repo, '_original_session'):
                repo._session = repo._original_session
                delattr(repo, '_original_session')
        
        self._session.close()
        logger.debug("Unit of Work session closed")
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if exc_type is not None:
            # Exception occurred, rollback
            self.rollback()
        elif not self._committed:
            # No exception but not committed, rollback
            self.rollback()
        
        self.close()
        return False  # Don't suppress exceptions


@asynccontextmanager
async def unit_of_work(session: Optional[Session] = None):
    """
    Async context manager for Unit of Work
    
    Usage:
        async with unit_of_work() as uow:
            uow.register_repository('tracking', tracking_repo)
            uow.register_repository('balance', balance_repo)
            
            # Use repositories
            tracking = await tracking_repo.save(tracking)
            balance = await balance_repo.save(balance)
            
            # Commit all changes atomically
            uow.commit()
    """
    uow = UnitOfWork(session=session)
    try:
        yield uow
        if not uow._committed and not uow._rolled_back:
            # Auto-commit if no exception and not explicitly committed/rolled back
            uow.commit()
    except Exception:
        if not uow._rolled_back:
            uow.rollback()
        raise
    finally:
        uow.close()
