import cv2
import numpy as np
import shutil

orig = r"C:\Users\Nabiullah\Desktop\Build\trade\site\screenshots\Gemini_Generated_Image_n5fk7un5fk7un5fk.png"
dst = r"C:\Users\Nabiullah\Desktop\Build\trade\site\assets\img\hero-trading-bg-new.png"

# Start from the pristine original each run.
shutil.copyfile(orig, dst)
img = cv2.imread(dst)  # BGR
h, w = img.shape[:2]

# Region of interest around the Gemini sparkle.
x0, y0, x1, y1 = 1280, 668, 1360, 756
roi = img[y0:y1, x0:x1]

# The sparkle is a bright, low-saturation (greyish/white) blob on a dark blue
# field. Detect it in HSV: low saturation + high value.
hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
s = hsv[:, :, 1].astype(np.int32)
v = hsv[:, :, 2].astype(np.int32)
sparkle = ((v > 90) & (s < 70)).astype(np.uint8) * 255

# Grow the mask so the soft glowing edges of the sparkle are fully covered.
sparkle = cv2.dilate(sparkle, np.ones((7, 7), np.uint8), iterations=2)

mask = np.zeros((h, w), np.uint8)
mask[y0:y1, x0:x1] = sparkle

# TELEA inpaint reconstructs the masked pixels from surrounding gradients,
# continuing the horizontal chart lines without a brightness seam.
out = cv2.inpaint(img, mask, 6, cv2.INPAINT_TELEA)
cv2.imwrite(dst, out)

print("mask pixels:", int((mask > 0).sum()))
