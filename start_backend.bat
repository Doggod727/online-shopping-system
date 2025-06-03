@echo off
echo Setting up environment variables...

echo Please enter your MySQL root password:
set /p MYSQL_PASSWORD=

set DATABASE_URL=mysql://root:%MYSQL_PASSWORD%@localhost/online_shopping
set REDIS_URL=redis://127.0.0.1:6379/
set HOST=127.0.0.1
set PORT=8080
set RUST_LOG=debug
set RUST_BACKTRACE=1

echo Starting backend service...
cd backend
cargo run 