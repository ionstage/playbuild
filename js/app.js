import { dom } from './dom.js';
import { CircuitModule } from './models/circuit-module.js';
import { Main } from './components/main.js';

dom.export('PlayBuildModule', CircuitModule.PlayBuildModule);
const main = new Main(dom.body());
