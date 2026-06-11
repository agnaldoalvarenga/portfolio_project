DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/ostentaculus
export DATABASE_URL

.PHONY: up down migrate seed test bootstrap

up:
	docker compose up -d

down:
	docker compose down -v

migrate:
	LOCAL_AUTH_SHIM=1 bash scripts/migrate.sh

seed:
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f scripts/seed.sql

test:
	pnpm test

# one-shot: db up -> wait healthy -> migrate -> seed
bootstrap: up
	until docker compose exec -T db pg_isready -U postgres -d ostentaculus >/dev/null 2>&1; do sleep 1; done
	$(MAKE) migrate
	$(MAKE) seed
	@echo "Ready. DATABASE_URL=$(DATABASE_URL)"
