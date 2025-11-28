.PHONY: up down ps logs restore clean

up:
	docker compose up -d --build

down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs -f



clean:
	docker compose down -v
