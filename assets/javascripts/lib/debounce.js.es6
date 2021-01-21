import discourseDebounce from "discourse-common/lib/debounce";
import { debounce } from "@ember/runloop";

// TODO: Remove this file and use discouseDebounce after the 2.7 release.
const debounceFunction = discourseDebounce || debounce;
export default debounceFunction;
