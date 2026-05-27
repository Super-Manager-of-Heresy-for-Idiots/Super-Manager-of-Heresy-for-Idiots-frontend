Итого: что сделано
docker-compose.yml — запуск всего стека одной командой
docker-compose up --build

Поднимает 3 сервиса:

Сервис	Контейнер	Порт	Описание
postgres	dnd-postgres	5432	PostgreSQL 16 с healthcheck
backend	dnd-backend	8080	Spring Boot API
frontend	dnd-frontend	80	React SPA (nginx), /api/* проксирует на backend:8080
nginx.conf — работает в обоих режимах
В docker-compose: backend резолвится через Docker DNS (127.0.0.11)
Standalone (без бекенда): nginx стартует, SPA работает, API-запросы вернут 502 пока бекенд не поднимется
Что нужно сделать бекендеру
1. Создать Dockerfile в корне проекта бекенда
   FROM eclipse-temurin:21-jdk-alpine AS build
   WORKDIR /app
   COPY . .
   RUN ./gradlew bootJar --no-daemon
# Если Maven: RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
# Maven: COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

2. Настроить application.yml для работы через env-переменные
   spring:
   datasource:
   url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/dnd_manager}
   username: ${SPRING_DATASOURCE_USERNAME:dnd}
   password: ${SPRING_DATASOURCE_PASSWORD:dnd_secret}
   jpa:
   hibernate:
   ddl-auto: ${SPRING_JPA_HIBERNATE_DDL_AUTO:update}
   properties:
   hibernate:
   dialect: org.hibernate.dialect.PostgreSQLDialect

Docker-compose уже прокидывает эти переменные: SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/dnd_manager и т.д.

3. CORS — НЕ нужен
   Фронтенд и бекенд живут за одним nginx. Браузер ходит на http://localhost:80, nginx проксирует /api/* на бекенд. Same-origin, CORS не срабатывает.

4. Путь к проекту бекенда
   В docker-compose.yml строка:

backend:
build:
context: ../Super-Manager-of-Heresy-for-Idiots   # <-- поменять на реальный путь

Бекендер должен подставить правильный путь к своему проекту относительно фронтенда, либо оба проекта положить рядом.

5. API-эндпоинты из контроллеров, которых нет во фронтенде
   Бекенд имеет эндпоинты, которые фронтенд пока не использует:

Контроллер	Эндпоинты	Статус
ArtifactController	/api/artifacts CRUD + /api/artifacts/place/{charId}/{slot}	Не реализовано во фронтенде
ConditionController	/api/conditions CRUD + модификаторы + apply/remove	Не реализовано во фронтенде
LevelUpController	/api/characters/{id}/level-up-options, /level-up, /rewards	Не реализовано во фронтенде
AdminController	/api/admin/skills CRUD	Не реализовано во фронтенде
AdminController	/api/admin/subclasses CRUD	Не реализовано во фронтенде
AdminController	/api/admin/feats CRUD	Не реализовано во фронтенде
AdminController	/api/admin/classes/{classId}/level-rewards	Не реализовано во фронтенде
Это не блокирует запуск — фронтенд просто не вызывает эти эндпоинты. Но если нужны UI-страницы для них, это отдельная задача.