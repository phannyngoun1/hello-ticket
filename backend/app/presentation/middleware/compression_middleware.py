"""
Response compression middleware using gzip compression
"""
from typing import Callable
import gzip
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.responses import StreamingResponse


class CompressionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to compress responses using gzip
    
    Compresses responses larger than minimum_size bytes (default: 1000).
    Only compresses text-based content types that the client accepts.
    """
    
    def __init__(self, app, minimum_size: int = 1000):
        super().__init__(app)
        self.minimum_size = minimum_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with compression"""
        # Get the response from the next middleware/handler
        response = await call_next(request)
        
        # Check if we should compress this response
        if not self._should_compress(request, response):
            return response
        
        # Skip streaming responses (they should be handled differently)
        if isinstance(response, StreamingResponse):
            return response
        
        # Compress the response body
        if hasattr(response, 'body') and response.body:
            body = response.body
            if isinstance(body, bytes) and len(body) >= self.minimum_size:
                # Compress the body
                compressed_body = gzip.compress(body)
                response.headers["Content-Encoding"] = "gzip"
                response.headers["Content-Length"] = str(len(compressed_body))
                response.body = compressed_body
                # Add Vary header for proper caching
                if "Vary" not in response.headers:
                    response.headers["Vary"] = "Accept-Encoding"
                elif "Accept-Encoding" not in response.headers.get("Vary", ""):
                    response.headers["Vary"] = response.headers["Vary"] + ", Accept-Encoding"
        
        return response
    
    def _should_compress(self, request: Request, response: Response) -> bool:
        """Check if response should be compressed"""
        # Don't compress if already compressed
        if response.headers.get("Content-Encoding"):
            return False
        
        # Check if client accepts gzip encoding
        accept_encoding = request.headers.get("Accept-Encoding", "")
        if "gzip" not in accept_encoding:
            return False
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        compressible_types = [
            "text/",
            "application/json",
            "application/javascript",
            "application/xml",
            "application/xhtml+xml",
            "application/rss+xml",
            "application/atom+xml",
        ]
        if not any(content_type.startswith(ct) for ct in compressible_types):
            return False
        
        # Check minimum size
        if hasattr(response, 'body') and response.body:
            if isinstance(response.body, bytes) and len(response.body) < self.minimum_size:
                return False
        
        return True

