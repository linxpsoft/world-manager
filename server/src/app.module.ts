import { Module } from "@nestjs/common";
import { ApiController } from "./api.controller";
import { WorldManagerService } from "./world-manager.service";

@Module({
	imports: [],
	providers: [WorldManagerService],
	controllers: [ApiController],
})
export class AppModule {
	constructor(private readonly worldManagerService: WorldManagerService) {}
}
