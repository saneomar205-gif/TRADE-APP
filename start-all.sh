#!/bin/bash
cd /home/z/my-project && node .next/standalone/server.js &
cd /home/z/my-project/mini-services/trading-signals && bun run dev &
wait
