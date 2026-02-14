import base64
import io
from PIL import Image

class ImageProcessor:
    @staticmethod
    def process_base64_image(base64_string: str):
        # Remove the header (e.g., "data:image/jpeg;base64,")
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
            
        # Decode and convert to PIL Image
        img_data = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(img_data))

processor = ImageProcessor()