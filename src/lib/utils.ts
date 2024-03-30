import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {Provider} from "@/type.ts";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function convert(provider: Provider): Record<string, string> {
    let result: Record<string, string> = {root: provider.rootPath}
    provider.options?.forEach((option) => {
        result[option.key] = option.value
    })
    return result
}
