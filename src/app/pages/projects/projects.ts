import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {toSignal} from "@angular/core/rxjs-interop";
import {ProjectService} from "../../services/project/project.service";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatDivider, MatList, MatListItem, MatListSubheaderCssMatStyler} from "@angular/material/list";
import {FileSizePipe} from "../../filesize-pipe";
import {MatButton} from "@angular/material/button";
import { open } from '@tauri-apps/plugin-dialog';
import {MatIcon} from "@angular/material/icon";


@Component({
  selector: 'app-projects',
    imports: [
        MatProgressSpinner,
        MatListItem,
        MatIcon,
        FileSizePipe,
        MatDivider,
        MatListSubheaderCssMatStyler,
        MatList,
        MatButton
    ],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
    private readonly service: ProjectService = inject(ProjectService)
    private projectResource$ = fromPromise(this.service.fetchProjects())
    protected readonly projects = toSignal(this.projectResource$, {initialValue: null})
    protected readonly loading = computed(() => !this.projects())

    public openFolder() {
       fromPromise(open({
            multiple: false,
            directory: true,
           canCreateDirectories: true,
           recursive: true
        }))
    }
}
