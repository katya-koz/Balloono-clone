class HandleSprites {
  constructor(player) {
    this.player = player;
  }
  spritePositionToImagePosition(row, column) {
    const BORDER_WIDTH = 1;
    const SPACING_WIDTH = 1;
    const SPRITE_WIDTH = this.player.dimensions.w;;
    const SPRITE_HEIGHT = this.player.dimensions.h;
    return {
      x: (
        BORDER_WIDTH +
        column * (SPACING_WIDTH + SPRITE_WIDTH)
      ),
      y: (
        BORDER_WIDTH +
        row * (SPACING_WIDTH + SPRITE_HEIGHT)
      )
    }
  }

}

export {HandleSprites}