import {
    rollup
} from 'rollup';
import npm from 'rollup-plugin-node-resolve';
import sourcemap from 'rollup-plugin-sourcemaps';
import commonjs from 'rollup-plugin-commonjs';

const bundle = () => {
    return rollup({
        entry: "./src/index.js",
        plugins: [sourcemap(),
            commonjs({
                ignoreGlobal: true,
            }),
            npm({
                jsnext: true,
                main: true,
                browser: true
            }),
        ]
    });
};

const main = async() => {
    try {
        const bundled = await bundle();
        bundled.write({
            format: 'cjs',
            sourcemap: true,
            dest: './lib/index.es2016.js'
        });
    } catch (e) {
        console.error(e);
    }
};

main();
