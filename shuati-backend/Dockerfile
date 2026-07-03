FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src/ src/
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN mkdir -p /app/uploads/avatars
COPY --from=build /build/target/*.jar /app/shuati-backend.jar
EXPOSE 80
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-Duser.timezone=Asia/Shanghai", "-jar", "/app/shuati-backend.jar"]
