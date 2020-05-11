import {
	NestFactory,
	BaseExceptionFilter,
	HttpAdapterHost,
} from "@nestjs/core";
import { AppModule } from "./app.module";
import { Catch, NotFoundException, ArgumentsHost } from "@nestjs/common";
import { Request, Response } from "express";
import * as path from "path";
import { NestExpressApplication } from "@nestjs/platform-express";

@Catch(NotFoundException)
class FrontendRenderFilter extends BaseExceptionFilter {
	catch(exception: NotFoundException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const req: Request = ctx.getRequest();

		if (req.originalUrl.startsWith("/api/"))
			return super.catch(exception, host);

		const res: Response = ctx.getResponse();

		res.sendFile(path.resolve("../frontend/dist/index.html"));
	}
}

function initFrontend(app: NestExpressApplication) {
	app.useStaticAssets(path.resolve("../frontend/dist"));

	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new FrontendRenderFilter(httpAdapter));
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	initFrontend(app);

	const port = process.env.PORT || 3000;
	await app.listen(port, () => {
		console.log("Server listening on *:" + port);
	});
}

bootstrap();
