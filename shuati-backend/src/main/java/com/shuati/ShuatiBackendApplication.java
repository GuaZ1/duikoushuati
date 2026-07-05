package com.shuati;

import com.shuati.config.FileStorageProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

@SpringBootApplication
@EnableConfigurationProperties(FileStorageProperties.class)
public class ShuatiBackendApplication {

	private static final Logger log = LoggerFactory.getLogger(ShuatiBackendApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(ShuatiBackendApplication.class, args);
	}

	@Bean
	CommandLineRunner showDbUrl(DataSource dataSource, Environment env) {
		return args -> {
			try (var conn = dataSource.getConnection()) {
				log.info("DB URL: {}", conn.getMetaData().getURL());
				log.info("DB User: {}", conn.getMetaData().getUserName());
				log.info("MYSQL_URL env: {}", env.getProperty("MYSQL_URL", "NOT SET"));
			}
		};
	}

}
