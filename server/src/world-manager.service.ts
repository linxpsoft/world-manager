import {
	Injectable,
	InternalServerErrorException,
	BadRequestException,
} from "@nestjs/common";
import * as Docker from "dockerode";
import fetch from "node-fetch";
import * as path from "path";

export type ContainerState =
	| "created"
	| "restarting"
	| "running"
	| "removing"
	| "paused"
	| "exited"
	| "dead";

@Injectable()
export class WorldManagerService {
	private readonly namePrefix = "/tivoli_world_";

	private readonly docker: Docker;

	constructor() {
		this.docker = new Docker();

		this.getWorlds().then(worlds => {
			console.log(worlds);
		});

		this.createWorld("beneville", 40020);
	}

	async getLatest() {
		const reposUrl =
			"https://git.tivolicloud.com/api/v4/projects/tivolicloud%2Finterface/registry/repositories";

		const repos: {
			id: string;
			name: string;
			path: string;
			project_id: number;
			location: string;
			created_at: string;
		}[] = await (await fetch(reposUrl)).json();

		const repoId = repos.find(repo => repo.name == "server").id;

		const tags: { name: string; path: string; location: string }[] = await (
			await fetch(reposUrl + "/" + repoId + "/tags")
		).json();

		return tags
			.filter(tag => /^[0-9]+?\.[0-9]+?\.[0-9]+?$/.test(tag.name))
			.sort((a, b) => {
				if (a.name > b.name) return -1;
				if (b.name > a.name) return 1;
				return 0;
			})[0];
	}

	async getWorlds() {
		// https://docs.docker.com/engine/api/v1.37/#operation/ContainerList
		const containers = await this.docker
			.listContainers({
				all: true,
				filters: {
					name: [this.namePrefix],
				},
			})
			.catch(error => {
				throw new InternalServerErrorException(error);
			});

		return containers.map(container => {
			const startingPort =
				container.Labels.startingPort == null
					? null
					: parseInt(container.Labels.startingPort);

			return {
				id: container.Id,
				name: container.Names[0].replace(this.namePrefix, ""),
				status: container.Status,
				version: container.Image.split(":")[1],
				state: container.State as ContainerState,
				startingPort,
				created: new Date(container.Created * 1000),
			};
		});
	}

	async createWorld(name: string, port: number) {
		const domain = "HIFI_DOMAIN_SERVER_";
		const assign = "HIFI_ASSIGNMENT_CLIENT_";

		if (/[^A-Z0-9-_]/i.test(name))
			throw new BadRequestException(
				"Invalid name. Letters, numbers, dashes and underscores only",
			);

		const imageName = (await this.getLatest()).location;

		const images = await this.docker.listImages();
		if (images.some(image => image.RepoTags.includes(imageName)) == false)
			await this.docker.pull(imageName, {});

		const container = await this.docker
			.createContainer({
				name: this.namePrefix + name,
				Image: imageName,
				HostConfig: {
					Binds: [
						path.resolve(__dirname, "worlds", name) +
							":/root/.local/share/Tivoli Cloud VR",
					],
					NetworkMode: "host",
					RestartPolicy: {
						Name: "always",
						MaximumRetryCount: 0,
					},
				},
				Labels: {
					startingPort: port + "",
				},
				Env: [
					domain + "HTTP_PORT=" + port,
					domain + "HTTPS_PORT=" + (port + 1),
					domain + "PORT=" + (port + 2),
					domain + "DTLS_PORT=" + (port + 3),
					assign + "AUDIO_MIXER_PORT=" + (port + 10),
					assign + "AVATAR_MIXER_PORT=" + (port + 11),
					assign + "ASSET_SERVER_PORT=" + (port + 13),
					assign + "MESSAGES_MIXER_PORT=" + (port + 14),
					assign + "ENTITY_SCRIPT_SERVER_PORT=" + (port + 15),
					assign + "ENTITIES_SERVER_PORT=" + (port + 16),
				],
			})
			.catch(error => {
				throw new InternalServerErrorException(error);
			});

		await container.start().catch(error => {
			throw new InternalServerErrorException(error);
		});
	}

	async updateWorld(id: string) {
		try {
			const container = this.docker.getContainer(id);
			if (container == null) throw new Error("Not found");

			const containerInfo = await container.inspect();

			const name = containerInfo.Name.replace(this.namePrefix, "");
			const port =
				containerInfo.Config.Labels.startingPort == null
					? null
					: parseInt(containerInfo.Config.Labels.startingPort);
			if (port == null) new Error("Can't find domain port");

			await container.stop();
			await container.remove();
			await this.createWorld(name, port);
		} catch (error) {
			throw new InternalServerErrorException(error);
		}

		return true;
	}
}
