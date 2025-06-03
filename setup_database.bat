@echo off
echo Setting up database and importing data...

echo Please enter MySQL root password:
set /p MYSQL_PASSWORD=

echo Creating database...
mysql -u root -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS online_shopping;"

echo Importing database structure and initial data...
mysql -u root -p%MYSQL_PASSWORD% online_shopping < db_scripts/setup_database.sql

echo Database setup completed! 