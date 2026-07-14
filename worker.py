
import json
import os
import time
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ChallengeRequired, BadPassword

# Função para carregar ou criar a sessão
def get_instagrapi_client(username, password, proxy=None, settings_path=None, verification_code=None):
    cl = Client()
    if proxy:
        cl.set_proxy(proxy)

    if settings_path and os.path.exists(settings_path):
        cl.load_settings(settings_path)

    try:
        cl.login(username, password)
        if settings_path:
            cl.dump_settings(settings_path)
        return cl
    except BadPassword:
        print(f"Erro: Senha incorreta para {username}")
        raise
    except LoginRequired:
        print(f"Erro: Login requerido para {username}. Tentando novamente...")
        # Tenta login novamente, pode ser que a sessão tenha expirado
        cl.login(username, password)
        if settings_path:
            cl.dump_settings(settings_path)
        return cl
    except ChallengeRequired:
        if verification_code:
            print(f"Tentando resolver desafio para {username} com código 2FA: {verification_code}")
            cl.challenge_code_handler = lambda username, choice: verification_code
            cl.login(username, password)
            if settings_path:
                cl.dump_settings(settings_path)
            return cl
        else:
            print(f"Desafio de segurança requerido para {username}. Código 2FA não fornecido.")
            raise # Re-lança a exceção para que o frontend possa lidar com ela
    except Exception as e:
        print(f"Erro inesperado ao logar {username}: {e}")
        raise

# Função para postar uma imagem
def post_photo(cl, image_path, caption):
    try:
        media = cl.photo_upload(
            image_path,
            caption=caption
        )
        return media.dict()
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)

    try:
        media = cl.photo_upload(
            image_path,
            caption=caption
        )
        return media.dict()
    except Exception as e:
        print(f"Erro ao postar imagem: {e}")
        raise

# Função para postar um vídeo (Reel)
def post_video(cl, video_path, caption, cover_path=None):
    try:
        media = cl.video_upload(
            video_path,
            caption=caption,
            usertags=[] # Adicionar tags se necessário
        )
        return media.dict()
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)
        if cover_path and os.path.exists(cover_path):
            os.remove(cover_path)

    try:
        media = cl.video_upload(
            video_path,
            caption=caption,
            usertags=[] # Adicionar tags se necessário
        )
        return media.dict()
    except Exception as e:
        print(f"Erro ao postar vídeo: {e}")
        raise

# Exemplo de uso (para testes)
if __name__ == "__main__":
    # Estes dados viriam do seu frontend/banco de dados
    INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
    INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")
    PROXY_URL = os.getenv("PROXY_URL") # Ex: "http://user:pass@host:port"

    if not INSTAGRAM_USERNAME or not INSTAGRAM_PASSWORD:
        print("Por favor, defina as variáveis de ambiente INSTAGRAM_USERNAME e INSTAGRAM_PASSWORD.")
    else:
        try:
            # Caminho para salvar as configurações da sessão
            session_file = f"./sessions/{INSTAGRAM_USERNAME}_session.json"
            os.makedirs(os.path.dirname(session_file), exist_ok=True)

            # Tenta logar ou carregar a sessão
            cl = get_instagrapi_client(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD, PROXY_URL, session_file)
            print(f"Login bem-sucedido para {INSTAGRAM_USERNAME}!")

            # Exemplo de postagem (substitua pelos seus caminhos de arquivo e legenda)
            # image_to_post = "/path/to/your/image.jpg"
            # video_to_post = "/path/to/your/video.mp4"
            # post_caption = "Minha primeira postagem com instagrapi! #instagrapi #python"

            # if os.path.exists(image_to_post):
            #     print(f"Postando imagem: {image_to_post}")
            #     result = post_photo(cl, image_to_post, post_caption)
            #     print(f"Imagem postada com sucesso: {result['code']}")
            # elif os.path.exists(video_to_post):
            #     print(f"Postando vídeo: {video_to_post}")
            #     result = post_video(cl, video_to_post, post_caption)
            #     print(f"Vídeo postado com sucesso: {result['code']}")
            # else:
            #     print("Nenhuma imagem ou vídeo de exemplo encontrado para postar.")

        except ChallengeRequired:
            print("Por favor, resolva o desafio de segurança e tente novamente.")
        except Exception as e:
            print(f"Ocorreu um erro: {e}")

