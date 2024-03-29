import {DataTableDemo} from "@/pages/TableDemo.tsx";
import {Toaster} from "@/components/ui/toaster.tsx";
import {ThemeProvider} from "@/components/theme-provider.tsx";

function App() {

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className=" m-10">
                <DataTableDemo/>
                <Toaster/>
            </div>
        </ThemeProvider>
    );
}

export default App;
