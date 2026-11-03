"""Recorta a logo Cactom do arquivo oficial (sem alterá-lo) e gera PNG com fundo transparente.
Uso: python3 scripts/build-wordmark.py  (requer Pillow e numpy)"""
from PIL import Image
import numpy as np
SRC='public/branding/cactom/identidade-oficial.png'
src=Image.open(SRC).convert('RGB')
def cut(box,out):
    a=np.asarray(src.crop(box)).astype(float)/255
    alpha=np.clip(((1-a.min(axis=2))-0.03)/0.62,0,1)
    rgb=np.clip(np.where(alpha[...,None]>0,(a-(1-alpha[...,None]))/np.maximum(alpha[...,None],1e-3),0),0,1)
    Image.fromarray((np.dstack([rgb,alpha])*255).astype('uint8'),'RGBA').save(out,optimize=True)
# Caixa medida: marca em x 170–617, y 74–207; lema em y 226–245 (6 px de respiro).
cut((164,68,623,213),'public/branding/cactom/cactom-wordmark.png')
cut((164,68,623,251),'public/branding/cactom/cactom-wordmark-lema.png')
