# Simple Makefile to run stacks
.PHONY: prod dev both down logs-dev logs-prod

prod:
	docker compose up --build -d

dev:
	docker compose -f docker-compose.dev.yml up --build -d

both:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

down:
	docker compose down

logs-dev:
	docker compose -f docker-compose.dev.yml logs -f api_dev

logs-prod:
	docker compose logs -f api
