import { Injectable } from '@angular/core';

export interface ProjectEntry {
    location: string,
    dbSize: number
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  public async fetchProjects(): Promise<ProjectEntry[]> {
    return [{location: "/sada", dbSize: 213342}, {location: "/szati", dbSize: 213342456}];
  }
}
