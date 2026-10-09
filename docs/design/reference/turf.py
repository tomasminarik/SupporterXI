import random, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
random.seed(11); np.random.seed(11)
W, H = 1740, 1140
# low-frequency patchiness
small = np.random.rand(H // 60 + 2, W // 60 + 2).astype(np.float32)
patch = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), dtype=np.float32) / 255.0
base = np.zeros((H, W, 3), np.float32)
base[..., 0] = 34 + patch * 14
base[..., 1] = 78 + patch * 26
base[..., 2] = 26 + patch * 10
img = Image.fromarray(base.astype(np.uint8))
d = ImageDraw.Draw(img)
for i in range(520000):
    x = random.uniform(0, W); y = random.uniform(0, H)
    ln = random.uniform(4, 11)
    a = random.gauss(-math.pi / 2, 0.5)
    p = patch[min(H - 1, int(y)), min(W - 1, int(x))]
    t = random.random()
    v = 0.55 + 0.75 * t * (0.7 + 0.6 * p)
    if random.random() < 0.035:
        col = (int(150 * v), int(150 * v), int(70 * v))  # dry blade
    else:
        col = (int(52 * v + 8), int(118 * v + 14), int(38 * v + 6))
    d.line([(x, y), (x + math.cos(a) * ln, y + math.sin(a) * ln)], fill=col, width=1)
img = img.filter(ImageFilter.GaussianBlur(0.45))
arr = np.asarray(img, dtype=np.float32)
arr += np.random.normal(0, 5, arr.shape)
Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save('turf.jpg', quality=84)
