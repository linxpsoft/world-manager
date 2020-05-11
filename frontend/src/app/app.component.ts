import { Component, Inject, OnInit, PLATFORM_ID } from "@angular/core";
import { World, WorldManagerService, Latest } from "./world-manager.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html",
	styleUrls: ["app.component.scss"],
})
export class AppComponent implements OnInit {
	serverAddress = "";

	worlds: World[] = [];
	latest: Latest = null;

	constructor(private readonly worldManager: WorldManagerService) {}

	ngOnInit() {
		this.serverAddress = window.location.hostname;

		this.worldManager.getWorlds().subscribe(worlds => {
			this.worlds = worlds;
		});

		this.worldManager.getLatest().subscribe(latest => {
			this.latest = latest;
		});
	}

	onUpdate(world: World) {
		this.worldManager.updateWorld(world.id).subscribe(
			yes => {
				console.log(yes);
			},
			error => {
				console.log(error);
			},
		);
	}
}
