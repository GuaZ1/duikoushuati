package com.shuati;

import com.shuati.config.FileStorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(FileStorageProperties.class)
public class ShuatiBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShuatiBackendApplication.class, args);
	}

}
