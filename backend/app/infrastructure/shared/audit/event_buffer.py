"""
Simplified in-memory event buffer for Phase 1 audit logging
Provides non-blocking async event batching
"""
from collections import deque
from asyncio import Queue, Lock, create_task
from datetime import datetime, timezone
from typing import List, Optional, Callable
import asyncio
import logging

logger = logging.getLogger(__name__)


class AuditEventBuffer:
    """
    Thread-safe, in-memory buffer for audit events (Phase 1 implementation)
    
    This simplified version provides:
    - Non-blocking event appends
    - Basic batching (flush every N events or time interval)
    - Graceful error handling (drops events if buffer full)
    """
    
    def __init__(
        self,
        batch_size: int = 50,  # Smaller batches for Phase 1
        flush_interval_seconds: float = 2.0,
        max_buffer_size: int = 5000
    ):
        self.batch_size = batch_size
        self.flush_interval = flush_interval_seconds
        self.max_buffer_size = max_buffer_size
        
        self._queue: Queue = Queue(maxsize=max_buffer_size)
        self._batch: deque = deque(maxlen=batch_size * 2)
        self._last_flush = datetime.now(timezone.utc)
        self._flush_task: Optional[asyncio.Task] = None
        self._running = False
        
        # Callback for when batch is ready
        self._flush_callback: Optional[Callable] = None
    
    def set_flush_callback(self, callback: Callable[[List], None]):
        """Set callback function to handle batch flushing (can be async)"""
        self._flush_callback = callback
    
    async def append(self, event) -> bool:
        """
        Append event to buffer (non-blocking, fire-and-forget)
        
        Returns:
            True if event was queued, False if buffer full
        """
        try:
            # Start flush task if not running
            if not self._running:
                self._running = True
                self._flush_task = create_task(self._auto_flush())
            
            # Non-blocking append
            try:
                self._queue.put_nowait(event)
                return True
            except asyncio.QueueFull:
                logger.warning("Audit log buffer full, dropping event")
                return False
                
        except Exception as e:
            logger.error(f"Error appending audit event: {e}", exc_info=True)
            return False
    
    async def _auto_flush(self):
        """Auto-flush buffer based on size and time"""
        while self._running:
            try:
                # Wait for events with timeout
                try:
                    event = await asyncio.wait_for(
                        self._queue.get(),
                        timeout=self.flush_interval
                    )
                    self._batch.append(event)
                except asyncio.TimeoutError:
                    # Timeout reached, check if we have events to flush
                    pass
                
                # Check if we should flush
                should_flush = (
                    len(self._batch) >= self.batch_size or
                    (self._batch and 
                     (datetime.now(timezone.utc) - self._last_flush).total_seconds() >= self.flush_interval)
                )
                
                if should_flush:
                    await self._flush()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in auto-flush: {e}", exc_info=True)
                await asyncio.sleep(1)  # Back off on error
    
    async def _flush(self):
        """Flush current batch"""
        if not self._batch:
            return
        
        batch = list(self._batch)
        self._batch.clear()
        self._last_flush = datetime.now(timezone.utc)
        
        if self._flush_callback:
            try:
                # Call the flush callback (which will persist to database)
                # Handle both sync and async callbacks
                import asyncio
                if asyncio.iscoroutinefunction(self._flush_callback):
                    await self._flush_callback(batch)
                else:
                    self._flush_callback(batch)
            except Exception as e:
                logger.error(f"Error in flush callback: {e}", exc_info=True)
                # Re-queue failed events (up to a limit to prevent infinite retry)
                if len(batch) < 100:  # Don't re-queue huge batches
                    for event in batch:
                        try:
                            self._queue.put_nowait(event)
                        except asyncio.QueueFull:
                            logger.warning("Cannot re-queue failed audit events, dropping")
                            break
    
    async def shutdown(self):
        """Graceful shutdown - flush remaining events"""
        self._running = False
        
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
        
        # Flush remaining events
        while not self._queue.empty():
            try:
                event = self._queue.get_nowait()
                self._batch.append(event)
            except asyncio.QueueEmpty:
                break
        
        if self._batch:
            await self._flush()

