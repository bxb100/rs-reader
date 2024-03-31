import {createContext, useEffect, useMemo, useState} from "react";
import {Provider, Scheme} from "@/type.ts";
import {store} from "@/lib/store.ts";
import {toast} from "@/components/ui/use-toast.ts";
import {appLocalDataDirPath} from "@/lib/env.ts";

export function useStore() {

    const [scheme, setScheme] = useState<Scheme>("fs");
    const [provider, setProvider] = useState<Provider>({
        scheme: "fs",
        rootPath: appLocalDataDirPath
    })

    useEffect(() => {
        store.get("enable").then((scheme) => {
            if (scheme) {
                setScheme(scheme as Scheme)
            }
        })
    }, [])

    useEffect(() => {
        getProvider(scheme).then((provider) => {
            if (provider) {
                setProvider(provider as Provider)
            }
        })
    }, [scheme])

    const getProvider = async (scheme: Scheme) => {
        return store.get(scheme)
    }

    const updateSchemeAndProvider = async (scheme: Scheme, provider: Provider) => {
        await store.set("enable", scheme)
        await store.set(scheme, provider)
        setScheme(scheme)
        setProvider(provider)
    }

    return useMemo(
        () => ({scheme, provider, updateProvider: updateSchemeAndProvider, getProvider}),
        [scheme, provider]
    )
}

export const StoreContext = createContext<ReturnType<typeof useStore>>({
    scheme: "fs",
    provider: {
        scheme: "fs",
        rootPath: appLocalDataDirPath
    },
    updateProvider: async () => {
        toast({
            title: "Error",
            variant: "destructive",
            description: "project not ready",
        })
    },
    getProvider: async (_scheme: Scheme) => {
        toast({
            title: "Error",
            variant: "destructive",
            description: "project not ready",
        })
    }
})
