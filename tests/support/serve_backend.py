"""Test-only host with a private authenticated loopback shutdown channel."""
from pathlib import Path
import asyncio
import hmac
import json
import os
import sys
import uvicorn

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'backend'))
server=uvicorn.Server(uvicorn.Config('app.main:app',host='127.0.0.1',port=int(os.getenv('DM_TEST_API_PORT','8000')),log_level='info'))

async def main():
    token=os.environ['DM_TEST_CONTROL_TOKEN'].encode()
    async def shutdown(reader,writer):
        try:
            message=await asyncio.wait_for(reader.readline(),2)
            if hmac.compare_digest(message.strip(),token):server.should_exit=True
        finally:
            writer.close();await writer.wait_closed()
    control=await asyncio.start_server(shutdown,'127.0.0.1',0)
    print(json.dumps({'controlPort':control.sockets[0].getsockname()[1],'serverPid':os.getpid()}),flush=True)
    async with control:await server.serve()

asyncio.run(main())
