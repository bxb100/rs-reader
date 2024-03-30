import {createContext, useEffect, useMemo, useState} from "react";
import {Provider, Scheme} from "@/type.ts";
import {store} from "@/lib/store.ts";
import {toast} from "@/components/ui/use-toast.ts";

export function useStore() {

    const [scheme, setScheme] = useState<Scheme>("fs");
    const [provider, setProvider] = useState<Provider>()

    useEffect(() => {
        store.get("enable").then((scheme) => {
            if (scheme) {
                setScheme(scheme as Scheme)
            }
        })
    }, [])

    useEffect(() => {
        store.get(scheme).then((provider) => {
            if (provider) {
                setProvider(provider as Provider)
            } else {
                setProvider({rootPath: "/", scheme: scheme})
            }
        })
    }, [scheme])

    const updateProvider = async (scheme: Scheme, provider: Provider) => {
        await store.set("enable", scheme)
        await store.set(scheme, provider)
        setScheme(scheme)
        setProvider(provider)
    }

    const updateScheme = (scheme: Scheme) => {
        setScheme(scheme)
    }

    return useMemo(
        () => ({scheme, provider, updateScheme, updateProvider}),
        [scheme, provider]
    )
}

export const StoreContext = createContext<ReturnType<typeof useStore>>({
    scheme: "fs",
    provider: undefined,
    updateScheme: () => {
        toast({
            title: "Error",
            variant: "destructive",
            description: "project not ready",
        })
    },
    updateProvider: async () => {
        toast({
            title: "Error",
            variant: "destructive",
            description: "project not ready",
        })
    }
})
