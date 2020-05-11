import { Controller, Get, Post, Param } from "@nestjs/common";
import { WorldManagerService } from "./world-manager.service";

@Controller("api")
export class ApiController {
	constructor(private readonly worldManager: WorldManagerService) {}

	@Get("worlds")
	getWorlds() {
		return this.worldManager.getWorlds();
	}

	@Get("worlds/latest")
	getLatest() {
		return this.worldManager.getLatest();
	}

	@Post("worlds/update/:id")
	updateWorld(@Param("id") id: string) {
		return this.worldManager.updateWorld(id);
	}
}
