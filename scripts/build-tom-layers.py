"""Gera as camadas animáveis do Tom a partir dos originais (sem alterá-los).

Entrada: public/branding/cactom/tom-oficial.png e tom-privacidade-v1.png
Saída:   public/branding/cactom/tom-camadas/*.png + camadas.json

Camadas: corpo (olhos e flor removidos por preenchimento local), olhos (esclera),
pupilas, flor compartilhada e corpo da pose de privacidade (flor removida).
Executar: python3 scripts/build-tom-layers.py
"""
import json, os
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'branding', 'cactom')
OUT = os.path.join(ROOT, 'tom-camadas')
FRAME = 1254
SCALE = 640 / FRAME
os.makedirs(OUT, exist_ok=True)

def load(name):
    return np.array(Image.open(os.path.join(ROOT, name)).convert('RGBA'))

def lum(a):
    return a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11

Y, X = np.mgrid[0:FRAME, 0:FRAME]

def flower_mask(a):
    r, g, b, al = [a[..., i].astype(int) for i in range(4)]
    m = (al > 20) & (r > 140) & (r > g + 25) & (b < 150) & (Y < 330)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    keep = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    m = (lab == keep).astype(np.uint8)
    return cv2.dilate(m, np.ones((5, 5), np.uint8)) > 0

def head_under_flower():
    # Arco suave do topo da cabeça sob a flor (só aparece em frestas quando a flor balança).
    return Y > (236 + ((X - 620) / 180.0) ** 2 * 74)

def remove_flower(a, fm):
    rgb = a[..., :3].copy()
    alpha = a[..., 3].copy()
    head = head_under_flower() & fm
    fill = cv2.inpaint(np.ascontiguousarray(rgb[..., ::-1]), head.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)[..., ::-1]
    rgb[head] = fill[head]
    alpha[fm & ~head] = 0
    alpha[head] = 255
    return np.dstack([rgb, alpha])

def eye_masks(a):
    L = lum(a)
    out = []
    for cx in (478, 772):
        ell = ((X - cx) / 104) ** 2 + ((Y - 597) / 128) ** 2 <= 1
        white = ell & (L > 170) & (a[..., 3] > 160)
        white = cv2.morphologyEx(white.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        cnts, _ = cv2.findContours(white, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        eye = np.zeros_like(white)
        cv2.drawContours(eye, [max(cnts, key=cv2.contourArea)], -1, 1, -1)
        eye = eye > 0
        dark = eye & (L < 110)
        pts = np.column_stack(np.nonzero(dark)[::-1]).astype(np.int32)
        pupil = np.zeros(eye.shape, np.uint8)
        cv2.fillPoly(pupil, [cv2.convexHull(pts)], 1)
        pupil = cv2.dilate(pupil, np.ones((3, 3), np.uint8)) > 0
        out.append((eye, pupil & eye))
    return out

def crop_save(img, name, boxes):
    al = img[..., 3]
    ys, xs = np.nonzero(al > 0)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    x0, y0 = max(0, x0 - 2), max(0, y0 - 2)
    x1, y1 = min(FRAME, x1 + 2), min(FRAME, y1 + 2)
    part = Image.fromarray(img[y0:y1, x0:x1])
    w, h = max(1, round((x1 - x0) * SCALE)), max(1, round((y1 - y0) * SCALE))
    part.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, name + '.png'), optimize=True)
    boxes[name] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}

open_pose = load('tom-oficial.png')
privacy = load('tom-privacidade-v1.png')
boxes = {}

fm = flower_mask(open_pose)
flower = open_pose.copy(); flower[..., 3] = np.where(fm, flower[..., 3], 0)
crop_save(flower, 'flor', boxes)

body = remove_flower(open_pose, fm)
eyes = np.zeros_like(open_pose); pupils = np.zeros_like(open_pose)
hole = np.zeros((FRAME, FRAME), np.uint8)
for eye, pupil in eye_masks(open_pose):
    sclera = np.median(open_pose[eye & ~pupil & (lum(open_pose) > 200)][:, :3], axis=0)
    e = open_pose.copy()
    e[pupil, :3] = sclera.astype(np.uint8)
    soft = cv2.GaussianBlur(eye.astype(np.float32), (0, 0), 1.1)
    e[..., 3] = (soft * 255).astype(np.uint8)
    eyes = np.where((soft > 0)[..., None] & (e[..., 3:4] > eyes[..., 3:4]), e, eyes)
    p = open_pose.copy()
    psoft = cv2.GaussianBlur(pupil.astype(np.float32), (0, 0), .9)
    p[..., 3] = (psoft * 255).astype(np.uint8)
    pupils = np.where(p[..., 3:4] > pupils[..., 3:4], p, pupils)
    hole |= cv2.dilate(eye.astype(np.uint8), np.ones((9, 9), np.uint8))
filled = cv2.inpaint(np.ascontiguousarray(body[..., 2::-1]), hole * 255, 15, cv2.INPAINT_TELEA)[..., ::-1]
body[hole > 0, :3] = filled[hole > 0]
crop_save(body, 'corpo', boxes)
crop_save(eyes, 'olhos', boxes)
crop_save(pupils, 'pupilas', boxes)

pfm = flower_mask(privacy)
crop_save(remove_flower(privacy, pfm), 'privacidade', boxes)

meta = {'frame': FRAME, 'scale': SCALE, 'origem': ['tom-oficial.png', 'tom-privacidade-v1.png'],
        'eyeCenterY': 597, 'eyes': [[478, 597], [772, 597]], 'flowerPivot': [620, 300], 'layers': boxes}
json.dump(meta, open(os.path.join(OUT, 'camadas.json'), 'w'), indent=2)
print(json.dumps(boxes))
