
try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    cv2 = None
    np = None  # type: ignore
    OPENCV_AVAILABLE = False
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Union, Tuple, Optional
import io
import logging

logger = logging.getLogger(__name__)

class SeatDetector:
    """
    Domain service for detecting seats and sections from floor plan files.
    Supports both raster images (via OpenCV) and vector files (SVG).
    """

    def detect(self, file_content: bytes, filename: str, target: str = "seats") -> List[Dict[str, Any]]:
        """
        Detect candidates from file content based on file type and target.

        Args:
            file_content: Raw bytes of the file
            filename: Name of the file (to determine type)
            target: "seats" or "sections"

        Returns:
            List of detected objects with percentage coordinates
        """
        is_svg = filename.lower().endswith('.svg') or file_content.strip().startswith(b'<svg') or file_content.strip().startswith(b'<?xml')

        if is_svg:
            return self._detect_from_svg(file_content, target)
        else:
            if not OPENCV_AVAILABLE:
                logger.warning("OpenCV not available. Cannot process raster images. Only SVG files are supported.")
                raise ValueError("OpenCV is required for processing raster images. Please install opencv-python-headless.")
            return self._detect_from_image(file_content, target)

    def _detect_from_image(self, file_content: bytes, target: str) -> List[Dict[str, Any]]:
        """Use OpenCV to detect shapes in raster images"""
        # Convert bytes to numpy array
        nparr = np.frombuffer(file_content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image")

        height, width = img.shape[:2]
        
        # Optimization: Resize large images
        # Detection on 4K images is slow and unnecessary. 
        # Resize to max dimension 2000px, calculate percentages based on resized dims 
        # (percentages will be screen-relative anyway so identical).
        max_dim = 2000
        scale = 1.0
        if max(height, width) > max_dim:
            scale = max_dim / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            img = cv2.resize(img, (new_width, new_height))
            # Update processing dimensions
            height, width = new_height, new_width
        
        # Preprocessing
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Adaptive thresholding to handle uneven lighting
        # Block size increased to 15 for better region handling in large venues
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 15, 3
        )
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        candidates = []
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            
            # Skip noise
            if area < 10: 
                continue
                
            x, y, w, h = cv2.boundingRect(cnt)
            cx = x + w/2
            cy = y + h/2
            
            # Percentage coordinates
            px = (cx / width) * 100
            py = (cy / height) * 100
            
            if target == "seats":
                # Filter for small, somewhat circular/square shapes
                perimeter = cv2.arcLength(cnt, True)
                if perimeter == 0: continue
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                
                # Heuristics for seats:
                # 1. Area relative to image size shouldn't be too huge
                image_area = width * height
                if area > (image_area * 0.05): # Too big to be a seat (5% of total)
                    continue
                    
                # 2. Aspect ratio should be roughly 1:1
                aspect_ratio = float(w) / h
                if 0.5 < aspect_ratio < 2.0:
                    candidates.append({
                        "x": px,
                        "y": py,
                        "radius": 1.2, # Default radius
                        "type": "circle"
                    })
            
            elif target == "sections":
                # Filter for larger shapes
                image_area = width * height
                if area < (image_area * 0.02): # Too small to be a section (less than 2%)
                    continue
                
                # Simplify polygon
                epsilon = 0.01 * cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon, True)
                
                # Convert points to percentage
                points = []
                for point in approx:
                    pt_x = (point[0][0] / width) * 100
                    pt_y = (point[0][1] / height) * 100
                    points.append(pt_x)
                    points.append(pt_y)
                
                candidates.append({
                    "x": px,
                    "y": py,
                    "type": "polygon",
                    "points": points
                })
                
        return candidates

    def _detect_from_svg(self, file_content: bytes, target: str) -> List[Dict[str, Any]]:
        """Parse SVG XML to extract shapes"""
        try:
            root = ET.fromstring(file_content)
        except ET.ParseError:
            raise ValueError("Invalid SVG file")
            
        # Get SVG dimensions
        # This is simplified; robust SVG dimension parsing is complex
        width_attr = root.get('width', '1000').strip().replace('px', '')
        height_attr = root.get('height', '1000').strip().replace('px', '')
        
        viewbox = root.get('viewBox')
        if viewbox:
            vb_parts = [float(x) for x in viewbox.replace(',', ' ').split()]
            if len(vb_parts) == 4:
                canvas_width = vb_parts[2]
                canvas_height = vb_parts[3]
            else:
                canvas_width = float(width_attr)
                canvas_height = float(height_attr)
        else:
            try:
                canvas_width = float(width_attr)
                canvas_height = float(height_attr)
            except ValueError:
                # Fallback
                canvas_width = 1000.0
                canvas_height = 1000.0

        candidates = []
        
        # define namespaces if needed, but for simple parsing we might ignore them 
        # or handle them generically.
        # Recursive search for all elements
        
        for elem in root.iter():
            tag = elem.tag.split('}')[-1] # Strip namespace
            
            if target == "seats":
                # Look for circles/rects
                if tag == 'circle':
                    cx = float(elem.get('cx', 0))
                    cy = float(elem.get('cy', 0))
                    r = float(elem.get('r', 0))
                    
                    # Convert to percentage
                    px = (cx / canvas_width) * 100
                    py = (cy / canvas_height) * 100
                    
                    candidates.append({
                        "x": px, 
                        "y": py, 
                        "radius": 1.2, # Normalize radius or use calculated
                        "type": "circle"
                    })
                    
                elif tag == 'rect':
                    x = float(elem.get('x', 0))
                    y = float(elem.get('y', 0))
                    w = float(elem.get('width', 0))
                    h = float(elem.get('height', 0))
                    
                    # Skip if too big (likely a background or section)
                    if (w * h) > (canvas_width * canvas_height * 0.05):
                        continue
                        
                    cx = x + w/2
                    cy = y + h/2
                    px = (cx / canvas_width) * 100
                    py = (cy / canvas_height) * 100
                    
                    candidates.append({
                        "x": px,
                        "y": py,
                        "type": "rectangle",
                        "width": (w/canvas_width)*100, 
                        "height": (h/canvas_height)*100
                    })
            
            elif target == "sections":
                # Look for paths, polygons, large rects
                if tag == 'path':
                    # Path parsing is complex; for MVP we might skip or use basic bounding box if possible
                    # Or try to parse 'd' attribute?
                    # For now, let's grab 'polygon' tags which are easier
                    pass
                    
                elif tag == 'polygon':
                    points_str = elem.get('points', '')
                    pts_raw = [float(x) for x in points_str.replace(',', ' ').split()]
                    
                    if not pts_raw: continue
                    
                    # Calculate centroid
                    xs = pts_raw[0::2]
                    ys = pts_raw[1::2]
                    cx = sum(xs) / len(xs)
                    cy = sum(ys) / len(ys)
                    
                    # Normalize points
                    norm_points = []
                    for i in range(0, len(pts_raw), 2):
                        norm_points.append((pts_raw[i] - cx))
                        norm_points.append((pts_raw[i+1] - cy))
                        
                    # Absolute centroid as %
                    px = (cx / canvas_width) * 100
                    py = (cy / canvas_height) * 100
                    
                    # Scaled points as % ?
                    # Ideally we want absolute points relative to canvas?
                    # The SeatDesigner expects points relative to CENTER? 
                    # Actually PlacementShape polygon points are usually relative to center if I recall correctly from layout-canvas.tsx
                    
                    candidates.append({
                        "x": px,
                        "y": py,
                        "type": "polygon",
                        "points": [] # Populating points is tricky without robust parser; 
                                     # but for sections we might want absolute coords? 
                                     # The layout-canvas polygon implementation expects points relative to center?
                    })

                elif tag == 'rect':
                     x = float(elem.get('x', 0))
                     y = float(elem.get('y', 0))
                     w = float(elem.get('width', 0))
                     h = float(elem.get('height', 0))
                     
                     # Only if big enough
                     if (w * h) > (canvas_width * canvas_height * 0.02):
                        cx = x + w/2
                        cy = y + h/2
                        px = (cx / canvas_width) * 100
                        py = (cy / canvas_height) * 100
                        
                        candidates.append({
                            "x": px,
                            "y": py,
                            "type": "rectangle",
                            "width": (w/canvas_width)*100,
                            "height": (h/canvas_height)*100
                        })

        return candidates
