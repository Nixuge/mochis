import { deserializeText, reverse, serializeText } from "../../shared/utils/aniwave/aniwaveUtils";
import { rc4Cypher } from "../../shared/utils/aniwave/rc4";
import { substituteString } from "../../shared/utils/aniwave/substituteString";

export function getVrf(input: string) {
    // required - transform to string
    input = '' + input;

    input = substituteString(input, "AP6GeR8H0lwUz1", "UAz8Gwl10P6ReH");
    input = rc4Cypher("ItFKjuWokn4ZpB", input);
    input = serializeText(input);
    input = reverse(input);

    input = reverse(input);
    input = rc4Cypher("fOyt97QWFB3", input);
    input = serializeText(input);
    input = substituteString(input, "1majSlPQd2M5", "da1l2jSmP5QM");

    input = substituteString(input, "CPYvHj09Au3", "0jHA9CPYu3v");
    input = reverse(input);
    input = rc4Cypher("736y1uTJpBLUX", input);
    input = serializeText(input);

    input = serializeText(input);
    return input;
}


export function decodeVideoSkipData(input: string) {
    input = '' + input;

    input = deserializeText(input);

    input = rc4Cypher("736y1uTJpBLUX", deserializeText(input));
    input = reverse(input);
    input = substituteString(input, "0jHA9CPYu3v", "CPYvHj09Au3");

    input = substituteString(input, "da1l2jSmP5QM", "1majSlPQd2M5");
    input = deserializeText(input);
    input = rc4Cypher("fOyt97QWFB3", input)
    input = reverse(input);

    input = reverse(input)
    input = deserializeText(input);
    input = rc4Cypher("ItFKjuWokn4ZpB", input)
    input = substituteString(input, "UAz8Gwl10P6ReH", "AP6GeR8H0lwUz1");

    return input;
}
