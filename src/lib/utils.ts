import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {FileInfo} from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const flattenPath = (info: FileInfo): string[] => {
    const current = String(info.path)

    if (!info.children || info.children.length === 0) {
        return [current]
    }

    return [
        current,
        ...info.children.flatMap(child => flattenPath(child))
    ]

}