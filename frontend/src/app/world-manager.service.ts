import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ContainerState } from "../../../server/src/world-manager.service";
import { map } from "rxjs/operators";

export interface World {
	id: string;
	name: string;
	status: string;
	version: string;
	state: ContainerState;
	startingPort: number;
	created: Date;
}

export interface Latest {
	name: string;
	path: string;
	location: string;
}

@Injectable({
	providedIn: "root",
})
export class WorldManagerService {
	constructor(private readonly http: HttpClient) {}

	getWorlds() {
		return this.http.get<World[]>("/api/worlds").pipe(
			map(worlds => {
				for (const world of worlds) {
					world.created = new Date(world.created);
				}
				return worlds;
			}),
		);
	}

	getLatest() {
		return this.http.get<Latest>("/api/worlds/latest");
	}

	updateWorld(id: string) {
		return this.http.post("/api/worlds/update/" + id, {});
	}
}
