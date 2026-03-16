module.exports = {
  apps: [{
    name: "tradevista",
    script: "/home/azureuser/Geet--Stock_Project_/backend/venv/bin/gunicorn",
    args: "--workers 3 --bind unix:/home/azureuser/Geet--Stock_Project_/backend/stock.sock config.wsgi:application",
    cwd: "/home/azureuser/Geet--Stock_Project_/backend",
    interpreter: "none",
    autorestart: true,
    watch: false,
  }]
}
