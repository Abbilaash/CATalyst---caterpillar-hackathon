import os

fpath = r'C:\Users\SURYA PRAKASH\AppData\Local\Programs\Python\Python310\lib\site-packages\amqtt\broker.py'
with open(fpath, "r", encoding="utf-8") as f:
    data = f.read()

data = data.replace("asyncio.Server | websockets.asyncio.server.Server", '"Any"')

with open(fpath, "w", encoding="utf-8") as f:
    f.write(data)
print("Patched amqtt successfully!")
