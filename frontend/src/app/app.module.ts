import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppComponent } from "./app.component";
import { MaterialModule } from "./material.module";

@NgModule({
	declarations: [AppComponent],
	imports: [HttpClientModule, BrowserAnimationsModule, MaterialModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
