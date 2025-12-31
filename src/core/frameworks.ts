// src/core/frameworks.ts

/**
 * Configuration rules determining which files and directories should be included or excluded 
 * during the scanning process for a specific framework.
 */
export interface PresetRule {
    /** * A list of directory names that should be forcefully included in the scan, 
     * overriding standard ignore rules.
     */
    includeDirs: string[];
    /** * A list of regular expressions matching specific filenames that must be included. 
     */
    includeFiles: RegExp[];
    /** * A list of regular expressions matching paths that should be strictly excluded 
     * from the scan (e.g., build artifacts, dependencies). 
     */
    exclude: RegExp[];
}

/**
 * Represents a supported development framework and the logic required to detect it 
 * within a project structure.
 */
export interface FrameworkDefinition {
    /** * The unique identifier for the framework (e.g., 'next', 'laravel'). 
     */
    id: string;
    /** * The human-readable display name of the framework. 
     */
    name: string;
    /** * The detection priority. Higher values are processed first. 
     * Specific frameworks (e.g., SvelteKit) should have higher priority than generic ones (e.g., Vite)
     * to prevent false positives.
     */
    priority: number;
    /** * A list of filenames (strings) or patterns (RegExp) that identify the presence of this framework.
     * The framework is considered detected if ANY of these triggers exist in the project root.
     */
    triggers: (string | RegExp)[];
    /** * The preset configuration rules to apply when this framework is detected. 
     */
    preset: PresetRule;
}

/**
 * A comprehensive registry of all supported development frameworks, including their detection triggers 
 * and scanning presets. This list covers Web, Mobile, Desktop, Game Development, and Backend systems.
 */
export const FRAMEWORKS: FrameworkDefinition[] = [
    {
        id: 'next',
        name: 'Next.js',
        priority: 100,
        triggers: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
        preset: {
            includeDirs: ['app', 'pages', 'components', 'lib', 'public', 'styles', 'utils', 'hooks', 'actions'],
            includeFiles: [/next\.config/, /package\.json/, /tsconfig/, /\.env/, /middleware/],
            exclude: [/\.next/, /node_modules/, /out/, /coverage/]
        }
    },
    {
        id: 'nuxt',
        name: 'Nuxt.js',
        priority: 100,
        triggers: ['nuxt.config.js', 'nuxt.config.ts'],
        preset: {
            includeDirs: ['pages', 'components', 'layouts', 'server', 'composables', 'plugins', 'assets', 'middleware'],
            includeFiles: [/nuxt\.config/, /package\.json/, /tsconfig/, /app\.vue/],
            exclude: [/\.nuxt/, /\.output/, /node_modules/, /dist/]
        }
    },
    {
        id: 'sveltekit',
        name: 'SvelteKit',
        priority: 95, 
        triggers: ['svelte.config.js'],
        preset: {
            includeDirs: ['src', 'static'],
            includeFiles: [/svelte\.config/, /vite\.config/, /package\.json/, /tsconfig/],
            exclude: [/\.svelte-kit/, /node_modules/, /build/]
        }
    },
    {
        id: 'astro',
        name: 'Astro',
        priority: 95,
        triggers: ['astro.config.mjs', 'astro.config.ts'],
        preset: {
            includeDirs: ['src', 'public'],
            includeFiles: [/astro\.config/, /package\.json/, /tsconfig/],
            exclude: [/\.astro/, /dist/, /node_modules/]
        }
    },
    {
        id: 'remix',
        name: 'Remix',
        priority: 95,
        triggers: ['remix.config.js'],
        preset: {
            includeDirs: ['app', 'public'],
            includeFiles: [/remix\.config/, /vite\.config/, /package\.json/],
            exclude: [/build/, /\.cache/, /node_modules/]
        }
    },
    {
        id: 'angular',
        name: 'Angular',
        priority: 90,
        triggers: ['angular.json'],
        preset: {
            includeDirs: ['src'],
            includeFiles: [/angular\.json/, /package\.json/, /tsconfig/],
            exclude: [/\.angular/, /node_modules/, /dist/]
        }
    },
    {
        id: 'nest',
        name: 'NestJS',
        priority: 90,
        triggers: ['nest-cli.json', /\.nest-cli/],
        preset: {
            includeDirs: ['src', 'test'],
            includeFiles: [/nest-cli/, /package\.json/, /tsconfig/, /\.env/],
            exclude: [/dist/, /node_modules/]
        }
    },
    {
        id: 'vite',
        name: 'Vite (React/Vue)',
        priority: 80, 
        triggers: ['vite.config.js', 'vite.config.ts'],
        preset: {
            includeDirs: ['src', 'public', 'assets', 'lib'],
            includeFiles: [/vite\.config/, /index\.html/, /package\.json/, /tsconfig/],
            exclude: [/dist/, /node_modules/]
        }
    },
    {
        id: 'node', 
        name: 'Node.js Project',
        priority: 10,
        triggers: ['package.json'],
        preset: {
            includeDirs: ['src', 'lib', 'config', 'routes', 'controllers', 'models', 'utils'],
            includeFiles: [/package\.json/, /\.env/, /index\.(js|ts)/, /server\.(js|ts)/],
            exclude: [/node_modules/, /dist/, /build/, /coverage/]
        }
    },
    {
        id: 'flutter',
        name: 'Flutter',
        priority: 90,
        triggers: ['pubspec.yaml'],
        preset: {
            includeDirs: ['lib', 'test', 'assets'],
            includeFiles: [/pubspec\.yaml/, /analysis_options\.yaml/],
            exclude: [/\.dart_tool/, /build/, /ios/, /android/, /web/, /linux/, /windows/, /macos/]
        }
    },
    {
        id: 'expo',
        name: 'Expo',
        priority: 90,
        triggers: ['app.json'], 
        preset: {
            includeDirs: ['app', 'components', 'assets', 'hooks', 'constants'],
            includeFiles: [/app\.json/, /package\.json/, /tsconfig/, /babel\.config/],
            exclude: [/\.expo/, /node_modules/, /web-build/]
        }
    },
    {
        id: 'reactnative',
        name: 'React Native (CLI)',
        priority: 85,
        triggers: [/metro\.config/],
        preset: {
            includeDirs: ['src', 'app', 'components'],
            includeFiles: [/metro\.config/, /package\.json/, /index\.js/],
            exclude: [/node_modules/, /ios/, /android/] 
        }
    },
    {
        id: 'tauri',
        name: 'Tauri (Rust)',
        priority: 95, 
        triggers: ['src-tauri'],
        preset: {
            includeDirs: ['src', 'src-tauri'],
            includeFiles: [/package\.json/, /Cargo\.toml/],
            exclude: [/target/, /node_modules/, /dist/]
        }
    },
    {
        id: 'electron',
        name: 'Electron',
        priority: 85,
        triggers: [/electron-builder/, /forge\.config/],
        preset: {
            includeDirs: ['src', 'app', 'resources'],
            includeFiles: [/main\.js/, /preload\.js/, /package\.json/],
            exclude: [/dist/, /out/, /node_modules/]
        }
    },
    {
        id: 'django',
        name: 'Django',
        priority: 90,
        triggers: ['manage.py'],
        preset: {
            includeDirs: [], 
            includeFiles: [/manage\.py/, /requirements\.txt/, /pyproject\.toml/, /\.env/],
            exclude: [/__pycache__/, /\.venv/, /venv/, /env/, /\.git/, /staticfiles/]
        }
    },
    {
        id: 'fastapi',
        name: 'FastAPI / Flask',
        priority: 50, 
        triggers: ['requirements.txt', 'pyproject.toml', 'main.py', 'app.py'],
        preset: {
            includeDirs: ['app', 'src', 'routers', 'models', 'api'],
            includeFiles: [/\.py$/, /requirements\.txt/, /\.env/],
            exclude: [/__pycache__/, /\.venv/, /venv/, /\.pytest_cache/]
        }
    },
    {
        id: 'streamlit',
        name: 'Streamlit',
        priority: 60,
        triggers: [/\.streamlit/, 'streamlit_app.py'],
        preset: {
            includeDirs: ['pages', '.streamlit'],
            includeFiles: [/\.py$/, /requirements\.txt/],
            exclude: [/__pycache__/, /\.venv/]
        }
    },
    {
        id: 'laravel',
        name: 'Laravel',
        priority: 90,
        triggers: ['artisan'],
        preset: {
            includeDirs: ['app', 'routes', 'config', 'database', 'resources', 'tests'],
            includeFiles: [/composer\.json/, /\.env/, /artisan/],
            exclude: [/vendor/, /storage/, /bootstrap\/cache/, /public/]
        }
    },
    {
        id: 'symfony',
        name: 'Symfony',
        priority: 90,
        triggers: ['symfony.lock', 'bin/console'],
        preset: {
            includeDirs: ['src', 'config', 'templates', 'migrations'],
            includeFiles: [/composer\.json/, /\.env/],
            exclude: [/vendor/, /var/, /public\/build/]
        }
    },
    {
        id: 'wordpress',
        name: 'WordPress',
        priority: 80,
        triggers: ['wp-config.php', 'wp-content'],
        preset: {
            includeDirs: ['wp-content/themes', 'wp-content/plugins'],
            includeFiles: [/wp-config\.php/, /\.htaccess/],
            exclude: [/wp-admin/, /wp-includes/, /node_modules/]
        }
    },
    {
        id: 'springboot',
        name: 'Spring Boot',
        priority: 95, 
        triggers: [/mvnw/, /gradlew/], 
        preset: {
            includeDirs: ['src/main/java', 'src/main/resources'],
            includeFiles: [/pom\.xml/, /build\.gradle/, /\.properties$/, /\.yaml$/],
            exclude: [/target/, /build/, /\.mvn/, /\.gradle/, /test/]
        }
    },
    {
        id: 'android_native',
        name: 'Android (Native)',
        priority: 90,
        triggers: ['app/src/main/AndroidManifest.xml'],
        preset: {
            includeDirs: ['app/src/main/java', 'app/src/main/res'],
            includeFiles: [/build\.gradle/, /gradle\.properties/],
            exclude: [/\.gradle/, /build/, /captures/]
        }
    },
    {
        id: 'unity',
        name: 'Unity',
        priority: 90,
        triggers: ['Assets', 'ProjectSettings'],
        preset: {
            includeDirs: ['Assets', 'Packages', 'ProjectSettings'],
            includeFiles: [/\.cs$/, /\.shader$/],
            exclude: [/Library/, /Temp/, /Logs/, /Builds/, /\.sln$/, /\.csproj$/]
        }
    },
    {
        id: 'dotnet',
        name: '.NET / ASP.NET Core',
        priority: 80,
        triggers: [/\.csproj$/, /\.sln$/],
        preset: {
            includeDirs: ['Controllers', 'Models', 'Views', 'Services', 'Data', 'Properties'],
            includeFiles: [/Program\.cs/, /Startup\.cs/, /appsettings\.json/, /\.csproj$/],
            exclude: [/bin/, /obj/, /\.vs/, /wwwroot\/lib/]
        }
    },
    {
        id: 'rails',
        name: 'Ruby on Rails',
        priority: 90,
        triggers: ['Gemfile', 'Rakefile', 'app/controllers'],
        preset: {
            includeDirs: ['app', 'config', 'db', 'lib', 'routes'],
            includeFiles: [/Gemfile/, /config\.ru/],
            exclude: [/tmp/, /log/, /vendor/, /public\/assets/]
        }
    },
    {
        id: 'phoenix',
        name: 'Phoenix (Elixir)',
        priority: 90,
        triggers: ['mix.exs', 'lib/phoenix'],
        preset: {
            includeDirs: ['lib', 'priv', 'test', 'config'],
            includeFiles: [/mix\.exs/, /\.formatter\.exs/],
            exclude: [/_build/, /deps/, /assets\/node_modules/]
        }
    },
    {
        id: 'go',
        name: 'Go',
        priority: 80,
        triggers: ['go.mod'],
        preset: {
            includeDirs: ['cmd', 'internal', 'pkg', 'api', 'web'],
            includeFiles: [/\.go$/, /go\.mod/, /go\.sum/],
            exclude: [/vendor/, /bin/]
        }
    },
    {
        id: 'rust',
        name: 'Rust',
        priority: 80,
        triggers: ['Cargo.toml'],
        preset: {
            includeDirs: ['src', 'tests', 'benches', 'examples'],
            includeFiles: [/Cargo\.toml/, /Cargo\.lock/],
            exclude: [/target/]
        }
    }
];