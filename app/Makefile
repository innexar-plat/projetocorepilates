PROJECT_NAME := braziliancorepilates
COMPOSE := docker compose
APP_SERVICE := app
DB_URL := $(shell sed -n 's/^DATABASE_URL=//p' .env.docker)
MAINTENANCE_NETWORK := $(PROJECT_NAME)_core-pilates-internal

.PHONY: help build build-no-cache build-debug up deploy down restart ps logs logs-app logs-db shell doctor clean-build db-bootstrap db-check

help:
	@echo "Brazilian Core Pilates - comandos disponiveis:"
	@echo "  make build          - build normal do app"
	@echo "  make build-no-cache - build sem cache do app"
	@echo "  make build-debug    - build com --progress=plain para descobrir gargalo"
	@echo "  make up             - sobe stack sem rebuild"
	@echo "  make deploy         - executa build separado e depois up -d --force-recreate"
	@echo "  make down           - para a stack"
	@echo "  make restart        - reinicia apenas o app"
	@echo "  make ps             - mostra status dos containers"
	@echo "  make logs           - logs de toda a stack"
	@echo "  make logs-app       - logs do app"
	@echo "  make logs-db        - logs do postgres"
	@echo "  make shell          - shell dentro do container do app"
	@echo "  make db-bootstrap   - cria schema Prisma e roda seed em container temporario"
	@echo "  make db-check       - confere tabelas e contagem de dados principais"
	@echo "  make doctor         - mostra disco, memoria e uso do Docker"
	@echo "  make clean-build    - limpa cache de build do Docker"

build:
	$(COMPOSE) build $(APP_SERVICE)

build-no-cache:
	$(COMPOSE) build --no-cache $(APP_SERVICE)

build-debug:
	DOCKER_BUILDKIT=1 $(COMPOSE) build --progress=plain $(APP_SERVICE)

up:
	$(COMPOSE) up -d

deploy: build
	$(COMPOSE) up -d --force-recreate $(APP_SERVICE)

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) up -d --force-recreate $(APP_SERVICE)

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f --tail=100

logs-app:
	$(COMPOSE) logs -f --tail=100 $(APP_SERVICE)

logs-db:
	$(COMPOSE) logs -f --tail=100 db

shell:
	$(COMPOSE) exec $(APP_SERVICE) sh

db-bootstrap:
	docker run --rm --network $(MAINTENANCE_NETWORK) -v "$(CURDIR)":/app -w /app -e DATABASE_URL='$(DB_URL)' node:22-alpine sh -lc 'npm ci --no-audit --no-fund --prefer-offline && npx prisma db push && npx tsx prisma/seed.ts'

db-check:
	$(COMPOSE) exec db psql -P pager=off -U postgres -d core_pilates -c '\dt'
	$(COMPOSE) exec db psql -P pager=off -U postgres -d core_pilates -c "select (select count(*) from plans) as plans, (select count(*) from classes) as classes, (select count(*) from class_sessions) as class_sessions;"

doctor:
	@echo "--- disk ---"
	@df -h /
	@echo "--- memory ---"
	@free -h
	@echo "--- docker ---"
	@docker system df

clean-build:
	docker builder prune -af