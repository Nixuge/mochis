import AniWorld from "../aniworld";

export default class SerienStream extends AniWorld {
  constructor() {
    super("https://s.to");

    // keep version from aniworld
    this.metadata = {
      ...this.metadata,
      id: "serien-stream",
      name: "Serien Stream (s.to) (@dominik)",
      description: "Almost all credits to @d9menik for this.",
      icon: "https://s.to/favicon.ico",
    };
  }
}