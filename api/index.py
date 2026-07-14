from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import os
import json
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ChallengeRequired, BadPassword

app = FastAPI()

# Diretório temporário para sessões na Vercel (limitação: não é persistente entre deploys)
SESSIONS_DIR = "/tmp/sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)

class LoginRequest(BaseModel):
    username: str
    password: str
    verification_code: Optional[str] = None
    proxy: Optional[str] = None

@app.get("/api/python/health")
def health_check():
    return {"status": "ok", "message": "Vercel Python API is running"}

@app.post("/api/python/login")
async def login(req: LoginRequest):
    cl = Client()
    if req.proxy:
        cl.set_proxy(req.proxy)
    
    try:
        if req.verification_code:
            cl.login(req.username, req.password, verification_code=req.verification_code)
        else:
            cl.login(req.username, req.password)
        
        user_info = cl.account_info()
        return {
            "message": "Login bem-sucedido",
            "username": req.username,
            "user_info": user_info.dict()
        }
    except ChallengeRequired:
        raise HTTPException(status_code=400, detail="ChallengeRequired")
    except BadPassword:
        raise HTTPException(status_code=401, detail="Senha incorreta")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
