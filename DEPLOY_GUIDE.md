# 🚀 คู่มือการ Deploy เว็บไซต์ Anti-Snore System

## 📋 สารบัญ
1. [เตรียม Database](#เตรียม-database)
2. [Deploy บน Heroku](#deploy-บน-heroku)
3. [Deploy บน Railway](#deploy-บน-railway)
4. [Deploy บน Render](#deploy-บน-render)
5. [Deploy บน VPS](#deploy-บน-vps)
6. [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)

---

## 🗄️ เตรียม Database

### ตัวเลือก Database

#### 1. **PostgreSQL (แนะนำสำหรับ Production)**
- **Heroku Postgres**: ฟรี 10,000 rows
- **Railway PostgreSQL**: ฟรี 5GB
- **Supabase**: ฟรี 500MB
- **Neon**: ฟรี 3GB
- **ElephantSQL**: ฟรี 20MB

#### 2. **SQLite (สำหรับ Development เท่านั้น)**
- ใช้ได้เฉพาะ local development
- ไม่เหมาะสำหรับ production

### สร้าง PostgreSQL Database

#### วิธีที่ 1: ใช้ Heroku Postgres
```bash
# หลังจาก deploy app บน Heroku แล้ว
heroku addons:create heroku-postgresql:hobby-dev
heroku config:get DATABASE_URL
```

#### วิธีที่ 2: ใช้ Supabase (ฟรี)
1. ไปที่ https://supabase.com
2. สร้างโปรเจกต์ใหม่
3. Copy Connection String จาก Settings > Database
4. ใช้รูปแบบ: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### วิธีที่ 3: ใช้ Railway
1. ไปที่ https://railway.app
2. สร้างโปรเจกต์ใหม่
3. เพิ่ม PostgreSQL service
4. Copy DATABASE_URL จาก Variables

### Setup Database Schema

หลังจากได้ DATABASE_URL แล้ว:

```bash
# ตั้งค่า environment variable
export DATABASE_URL=postgresql://user:pass@host:port/dbname

# หรือสร้างไฟล์ .env
echo "DATABASE_URL=postgresql://user:pass@host:port/dbname" > .env

# รันสคริปต์สร้าง schema
python database_setup_postgresql.py
```

---

## 🌐 Deploy บน Heroku

### ขั้นตอนที่ 1: ติดตั้ง Heroku CLI
```bash
# Windows
# ดาวน์โหลดจาก https://devcenter.heroku.com/articles/heroku-cli

# Mac
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### ขั้นตอนที่ 2: Login และสร้าง App
```bash
# Login
heroku login

# สร้าง app ใหม่
heroku create your-app-name

# เพิ่ม PostgreSQL database
heroku addons:create heroku-postgresql:hobby-dev
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables
```bash
# ตั้งค่า Secret Key
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# ตั้งค่า PORT (Heroku จะตั้งให้อัตโนมัติ)
# ตั้งค่า DEBUG
heroku config:set DEBUG=False
```

### ขั้นตอนที่ 4: Deploy
```bash
# Initialize git (ถ้ายังไม่มี)
git init
git add .
git commit -m "Initial commit"

# เพิ่ม Heroku remote
heroku git:remote -a your-app-name

# Deploy
git push heroku main

# หรือถ้าใช้ branch master
git push heroku master
```

### ขั้นตอนที่ 5: Setup Database
```bash
# รัน migration
heroku run python database_setup_postgresql.py

# หรือเข้าไปรันใน shell
heroku run bash
python database_setup_postgresql.py
```

### ขั้นตอนที่ 6: เปิดใช้งาน
```bash
# เปิดเว็บไซต์
heroku open

# ดู logs
heroku logs --tail
```

---

## 🚂 Deploy บน Railway

### ขั้นตอนที่ 1: สร้าง Account
1. ไปที่ https://railway.app
2. Sign up ด้วย GitHub

### ขั้นตอนที่ 2: สร้างโปรเจกต์
1. คลิก "New Project"
2. เลือก "Deploy from GitHub repo"
3. เลือก repository ของคุณ

### ขั้นตอนที่ 3: เพิ่ม PostgreSQL
1. คลิก "+ New"
2. เลือก "Database" > "Add PostgreSQL"
3. Railway จะสร้าง DATABASE_URL อัตโนมัติ

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables
ใน Settings > Variables:
```
SECRET_KEY=<generate-random-key>
DEBUG=False
PORT=5000
```

### ขั้นตอนที่ 5: Setup Database
1. ไปที่ PostgreSQL service
2. คลิก "Connect" > "Query"
3. รัน SQL จาก `database_setup_postgresql.py` หรือ
4. ใช้ Railway CLI:
```bash
railway run python database_setup_postgresql.py
```

### ขั้นตอนที่ 6: Deploy
Railway จะ deploy อัตโนมัติเมื่อ push code ไป GitHub

---

## 🎨 Deploy บน Render

### ขั้นตอนที่ 1: สร้าง Account
1. ไปที่ https://render.com
2. Sign up ด้วย GitHub

### ขั้นตอนที่ 2: สร้าง PostgreSQL Database
1. คลิก "New +" > "PostgreSQL"
2. ตั้งชื่อ database
3. Copy Internal Database URL

### ขั้นตอนที่ 3: สร้าง Web Service
1. คลิก "New +" > "Web Service"
2. เชื่อมต่อ GitHub repository
3. ตั้งค่า:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server_improve_fixed:app --bind 0.0.0.0:$PORT`
   - **Environment**: Python 3

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables
```
DATABASE_URL=<from-postgres-service>
SECRET_KEY=<generate-random-key>
PORT=10000
DEBUG=False
```

### ขั้นตอนที่ 5: Setup Database
ใช้ Render Shell:
```bash
render:shell
python database_setup_postgresql.py
```

---

## 🖥️ Deploy บน VPS (Ubuntu/Debian)

### ขั้นตอนที่ 1: ติดตั้ง Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Python และ dependencies
sudo apt install python3 python3-pip python3-venv nginx postgresql postgresql-contrib -y

# ติดตั้ง PostgreSQL client
sudo apt install libpq-dev -y
```

### ขั้นตอนที่ 2: สร้าง PostgreSQL Database
```bash
# เข้า PostgreSQL
sudo -u postgres psql

# สร้าง database และ user
CREATE DATABASE snore_system;
CREATE USER snore_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE snore_system TO snore_user;
\q
```

### ขั้นตอนที่ 3: Setup Application
```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> anti_snore
cd anti_snore

# สร้าง virtual environment
python3 -m venv venv
source venv/bin/activate

# ติดตั้ง dependencies
pip install -r requirements.txt

# ตั้งค่า environment variables
nano .env
# เพิ่ม:
# DATABASE_URL=postgresql://snore_user:your_secure_password@localhost:5432/snore_system
# SECRET_KEY=<generate-random-key>
# DEBUG=False

# Setup database
python database_setup_postgresql.py
```

### ขั้นตอนที่ 4: ตั้งค่า Gunicorn
```bash
# สร้าง systemd service
sudo nano /etc/systemd/system/anti-snore.service
```

เพิ่มเนื้อหา:
```ini
[Unit]
Description=Anti-Snore Gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/anti_snore
Environment="PATH=/var/www/anti_snore/venv/bin"
ExecStart=/var/www/anti_snore/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/var/www/anti_snore/anti_snore.sock \
    server_improve_fixed:app

[Install]
WantedBy=multi-user.target
```

```bash
# เริ่ม service
sudo systemctl start anti-snore
sudo systemctl enable anti-snore
```

### ขั้นตอนที่ 5: ตั้งค่า Nginx
```bash
sudo nano /etc/nginx/sites-available/anti-snore
```

เพิ่มเนื้อหา:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/anti_snore/anti_snore.sock;
    }

    location /static {
        alias /var/www/anti_snore/static;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/anti-snore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### ขั้นตอนที่ 6: ตั้งค่า SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## ⚙️ การตั้งค่า Environment Variables

### ตัวแปรที่จำเป็น:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Flask
SECRET_KEY=<random-32-char-string>
DEBUG=False

# Server
PORT=5000
HOST=0.0.0.0
```

### สร้าง Secret Key:
```python
import secrets
print(secrets.token_hex(32))
```

---

## 🔍 Troubleshooting

### ปัญหา: Database connection failed
- ตรวจสอบ DATABASE_URL ถูกต้อง
- ตรวจสอบ firewall rules
- ตรวจสอบ database credentials

### ปัญหา: Port already in use
- เปลี่ยน PORT ใน environment variables
- หรือ kill process ที่ใช้ port นั้น

### ปัญหา: Module not found
- ตรวจสอบ requirements.txt
- รัน `pip install -r requirements.txt` อีกครั้ง

### ปัญหา: Static files not loading
- ตรวจสอบ STATIC_FOLDER path
- ตรวจสอบ Nginx configuration (ถ้าใช้)

---

## 📝 Checklist ก่อน Deploy

- [ ] สร้าง PostgreSQL database
- [ ] ตั้งค่า DATABASE_URL
- [ ] รัน database_setup_postgresql.py
- [ ] ตั้งค่า SECRET_KEY
- [ ] ตั้งค่า DEBUG=False
- [ ] ทดสอบ local ก่อน deploy
- [ ] ตรวจสอบ requirements.txt
- [ ] ตรวจสอบ Procfile (ถ้าใช้ Heroku)
- [ ] ตั้งค่า CORS (ถ้าจำเป็น)
- [ ] Backup database

---

## 🎉 เสร็จสิ้น!

หลังจาก deploy สำเร็จ:
1. เปิดเว็บไซต์
2. ทดสอบ login/register
3. ทดสอบการบันทึกเสียง
4. ตรวจสอบ logs

**Happy Deploying! 🚀**

