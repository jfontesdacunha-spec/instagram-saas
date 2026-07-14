
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import os
import json
import asyncio
from instagrapi.exceptions import LoginRequired, ChallengeRequired, BadPassword
import requests
import tempfile

async def download_media(url: str, media_type: str) -> str:
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Criar um arquivo temporário para salvar a mídia
        suffix = ".jpg" if media_type == "photo" else ".mp4"
        fd, path = tempfile.mkstemp(suffix=suffix)
        
        with os.fdopen(fd, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return path
    except Exception as e:
        print(f"Erro ao baixar mídia de {url}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao baixar mídia: {e}")
from worker import get_instagrapi_client, post_photo, post_video

app = FastAPI()

# Diretório para armazenar as sessões
SESSIONS_DIR = "./sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)

class LoginRequest(BaseModel):
    username: str
    password: str
    verification_code: Optional[str] = None
    proxy: Optional[str] = None

class PostRequest(BaseModel):
    account_id: str # Usaremos o username como account_id por enquanto
    media_type: str # 'photo' ou 'video'
    media_url: str # URL da mídia no Cloudinary
    caption: str
    cover_url: Optional[str] = None # Para vídeos

@app.post("/login")
async def login_instagram_account(req: LoginRequest):
    session_file = os.path.join(SESSIONS_DIR, f"{req.username}_session.json")
    try:
        cl = get_instagrapi_client(req.username, req.password, req.proxy, session_file, req.verification_code)
        return {"message": "Login bem-sucedido", "username": req.username}
    except ChallengeRequired:
        raise HTTPException(status_code=400, detail="ChallengeRequired: 2FA ou outro desafio de segurança necessário. Por favor, tente novamente com o código de verificação.")
    except BadPassword:
        raise HTTPException(status_code=401, detail="BadPassword: Usuário ou senha incorretos.")
    except LoginRequired:
        raise HTTPException(status_code=401, detail="LoginRequired: A sessão expirou ou é inválida. Tente fazer login novamente.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no login: {e}")

@app.post("/post")
async def publish_instagram_post(req: PostRequest):
    session_file = os.path.join(SESSIONS_DIR, f"{req.account_id}_session.json")
    if not os.path.exists(session_file):
        raise HTTPException(status_code=404, detail=f"Sessão não encontrada para a conta {req.account_id}. Faça login primeiro.")

    # Para simplificar, vamos assumir que o proxy está salvo na sessão ou é passado de alguma forma
    # Por enquanto, o proxy não está sendo persistido com a sessão, então vamos precisar de uma forma de obtê-lo
    # Para este MVP, vamos ignorar o proxy aqui e focar na funcionalidade básica.
    cl = Client()
    cl.load_settings(session_file)

    # O instagrapi precisa de um caminho de arquivo local, não de uma URL
    # Em um sistema real, você baixaria a mídia da URL do Cloudinary para um arquivo temporário
    # Baixar a mídia da URL do Cloudinary
    local_media_path = await download_media(req.media_url, req.media_type)

    try:
        if req.media_type == "photo":
            result = post_photo(cl, local_media_path, req.caption)
        elif req.media_type == "video":
            result = post_video(cl, local_media_path, req.caption, req.cover_url)
        else:
            raise HTTPException(status_code=400, detail="Tipo de mídia inválido. Use 'photo' ou 'video'.")
        return {"message": "Postagem bem-sucedida", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na postagem: {e}")

@app.post("/user-info")
async def get_user_info(req: LoginRequest):
    session_file = os.path.join(SESSIONS_DIR, f"{req.username}_session.json")
    if not os.path.exists(session_file):
        raise HTTPException(status_code=404, detail=f"Sessão não encontrada para a conta {req.username}. Faça login primeiro.")
    
    cl = Client()
    cl.load_settings(session_file)
    
    try:
        user_info = cl.account_info()
        return {"user_info": user_info.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter informações do usuário: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
