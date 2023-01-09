//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./Trigonometry.sol";
import "./Utilities.sol";
import "hardhat/console.sol";

contract Renderer {
  uint256 constant SIZE = 500;
  uint256 constant RADIUS = 200;
  uint256 constant PRECISION_DEGREE = 7;
  uint256 constant PRECISION = 10**PRECISION_DEGREE;

  struct ColorPalette {
    uint256 primaryHue;
    uint256 secondaryHue;
    utils.HSL primaryColorHsl;
    utils.HSL secondaryColorHsl;
    utils.HSL backgroundColorHsl;
    utils.HSL darkerSecondaryHsl;
    utils.HSL[] primaryColorsHsl;
    utils.HSL[] secondaryColorsHsl;
  }

  struct Kaleidoscope {
    uint256 tokenId;
    uint256 repetitions;
    uint256 numInsideArtifacts;
    uint256 numOutsideArtifacts;
    uint256 centerX_precise;
    uint256 centerY_precise;
    bool hasGradient;
    bool hasSecondaryColor;
  }

  struct AnimatedCircle {
    // Start position
    int256 x1;
    int256 y1;
    // End position
    int256 x2;
    int256 y2;
    uint256 radius1;
    uint256 radius2;
    uint256 alternatingClass;
    uint256 duration;
    utils.HSL color;
  }

  struct AnimatedTriangle {
    uint256 x1;
    uint256 y1;
    uint256 centerX;
    uint256 centerY;
    uint256 duration;
    utils.HSL color;
  }

  struct AnimatedRectangle {
    uint256 width;
    uint256 height;
    uint256 x;
    uint256 y;
    uint256 duration;
    utils.HSL color;
  }

  function colorPaletteForKaleidescope(Kaleidoscope memory _kaleidoscope)
    public
    pure
    returns (ColorPalette memory palette)
  {
    palette.primaryHue = utils.randomRange(_kaleidoscope.tokenId, "primaryHue", 0, 360);
    palette.secondaryHue = _kaleidoscope.hasSecondaryColor ? (palette.primaryHue + 240) % 360 : palette.primaryHue;
    palette.primaryColorHsl = utils.HSL(palette.primaryHue, 100, 30);
    palette.secondaryColorHsl = utils.HSL(palette.secondaryHue, 100, 70);
    palette.backgroundColorHsl = utils.HSL(palette.primaryHue, 100, 10);
    palette.darkerSecondaryHsl = utils.HSL((palette.primaryHue + 10) % 360, 100, 10);
    palette.primaryColorsHsl = utils.generateColors(palette.primaryHue, _kaleidoscope.numInsideArtifacts + 1);
    palette.secondaryColorsHsl = utils.generateColors(palette.secondaryHue, _kaleidoscope.numInsideArtifacts + 1);

    return palette;
  }

  function kaleidoscopeForTokenId(uint256 _tokenId) public pure returns (Kaleidoscope memory kaleidoscope) {
    kaleidoscope.tokenId = _tokenId;
    kaleidoscope.repetitions = utils.randomRange(_tokenId, "repetitions", 3, 20);
    kaleidoscope.numInsideArtifacts = utils.randomRange(_tokenId, "numInsideArtifacts", 3, 10);
    kaleidoscope.numOutsideArtifacts = utils.randomRange(_tokenId, "numOutsideArtifacts", 1, 4);
    kaleidoscope.hasGradient = utils.randomRange(_tokenId, "hasGradient", 1, 10) == 5;
    kaleidoscope.hasSecondaryColor = utils.randomRange(_tokenId, "secondaryColor", 1, 8) == 8;

    uint256 angle = (((180 - 360 / kaleidoscope.repetitions) / 2) * Trigonometry.PI) / 180;
    kaleidoscope.centerX_precise = uint256(
      (int256(RADIUS) * Trigonometry.cos(angle)) / int256(10**(18 - PRECISION_DEGREE))
    );
    kaleidoscope.centerY_precise = uint256(
      (int256(RADIUS) * Trigonometry.sin(angle)) / int256(10**(18 - PRECISION_DEGREE))
    );

    return kaleidoscope;
  }

  function circleAtIndexForKaleidescope(
    Kaleidoscope memory _kaleidoscope,
    ColorPalette memory _palette,
    uint256 _index
  ) public pure returns (AnimatedCircle memory circle) {
    uint256 yUpperBound = (_kaleidoscope.centerY_precise / PRECISION) + RADIUS / 8;

    circle.y1 = int256(
      utils.randomRange(_kaleidoscope.tokenId, string.concat("y1", utils.uint2str(_index)), 20, yUpperBound)
    );
    circle.y2 = int256(
      utils.randomRange(_kaleidoscope.tokenId, string.concat("y2", utils.uint2str(_index)), 20, yUpperBound)
    );

    circle.alternatingClass = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("alternatingClass", utils.uint2str(_index)),
      0,
      3
    );

    if (circle.y1 > circle.y2 && circle.alternatingClass % 2 == 0) {
      int256 temp = circle.y1;
      circle.y1 = circle.y2;
      circle.y2 = temp;
    }

    int256 gradient_1000 = int256((_kaleidoscope.centerY_precise * 1000) / _kaleidoscope.centerX_precise);

    uint256 radiusUB = (_kaleidoscope.centerX_precise / PRECISION) * 2;
    circle.radius1 = uint256(
      utils.min((radiusUB * (1000 - (uint256(circle.y1) * 1000) / yUpperBound)) / 1000, radiusUB)
    );
    circle.radius2 = uint256(
      utils.min((radiusUB * (1000 - (uint256(circle.y2) * 1000) / yUpperBound)) / 1000, radiusUB)
    );

    // x1 should be within bounds of triangular path
    int256 lb1 = (circle.y1 * 1000) / gradient_1000;
    circle.x1 = int256(lb1 - int256(circle.radius1) * 2);

    // x2 should be within bounds of triangular path
    int256 lb2 = (circle.y2 * 1000) / gradient_1000;
    circle.x2 = int256(2 * int256(_kaleidoscope.centerX_precise / PRECISION) - lb2 + int256(circle.radius2) * 2);

    circle.duration = utils.randomRange(_kaleidoscope.tokenId, string.concat("duration", utils.uint2str(_index)), 3, 7);

    circle.color = _index % 2 == 0 ? _palette.primaryColorsHsl[_index + 1] : _palette.secondaryColorsHsl[_index + 1];

    return circle;
  }

  function rectangleAtIndexForKaleidescope(
    Kaleidoscope memory _kaleidoscope,
    ColorPalette memory _palette,
    uint256 _index
  ) public pure returns (AnimatedRectangle memory rectangle) {
    rectangle.width = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("rectwidth", utils.uint2str(_index)),
      (_kaleidoscope.centerY_precise / PRECISION) / 2,
      (_kaleidoscope.centerY_precise / PRECISION)
    );
    rectangle.height = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("rectheight", utils.uint2str(_index)),
      (_kaleidoscope.centerY_precise / PRECISION),
      _kaleidoscope.centerY_precise * 2 + RADIUS / 8
    );
    rectangle.x = 0;
    rectangle.y = _kaleidoscope.centerY_precise / PRECISION;
    rectangle.duration = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("rectduration", utils.uint2str(_index)),
      5,
      10
    );
    rectangle.color = _index % 2 == 0 ? _palette.primaryColorsHsl[0] : _palette.secondaryColorsHsl[0];

    return rectangle;
  }

  function getCircleSVG(AnimatedCircle memory _circle) public pure returns (string memory) {
    string memory animations = string.concat(
      '<animate attributeName="r" values="',
      utils.uint2str(_circle.radius1),
      ";",
      utils.uint2str(_circle.radius2),
      ";",
      utils.uint2str(_circle.radius1),
      ";",
      utils.uint2str(_circle.radius2),
      '" calcMode="linear" dur="',
      utils.uint2str(_circle.duration * 2),
      's" repeatCount="indefinite"/>'
    );

    animations = string.concat(
      animations,
      '<animate attributeName="cy" values="',
      utils.int2str(_circle.y1),
      ";",
      utils.int2str(_circle.y2),
      ";",
      utils.int2str(_circle.y1),
      ";",
      utils.int2str(_circle.y2),
      '" calcMode="linear" dur="',
      utils.uint2str(_circle.duration * 2),
      's" repeatCount="indefinite"/>'
    );

    animations = string.concat(
      animations,
      '<animate attributeName="cx" values="',
      utils.int2str(_circle.x1),
      ";",
      utils.int2str(_circle.x2),
      ";",
      utils.int2str(_circle.x1),
      ";",
      utils.int2str(_circle.x2),
      '" calcMode="linear" dur="',
      utils.uint2str(_circle.duration * 2),
      's" repeatCount="indefinite"/>'
    );

    return
      string.concat(
        '<circle cx="',
        utils.int2str((_circle.x1 + _circle.x2) / 2),
        '" cy="',
        utils.int2str((_circle.y1 + _circle.y2) / 2),
        '" r="',
        utils.uint2str((_circle.radius1 + _circle.radius2) / 2),
        '" fill="',
        utils.getHslString(_circle.color),
        '">',
        animations,
        "</circle>"
      );
  }

  function getRectangleSVG(AnimatedRectangle memory _rectangle) public pure returns (string memory) {
    string memory animations = string.concat(
      '<animateTransform attributeName="transform" type="rotate" from="0 0 -',
      utils.uint2str(_rectangle.y),
      '" to="-360 0 -',
      utils.uint2str(_rectangle.y),
      '" begin="0s" dur="',
      utils.uint2str(_rectangle.duration),
      's" repeatCount="indefinite" />'
    );

    return
      string.concat(
        '<rect rx="3" ry="3" x="0" y="-',
        utils.uint2str(_rectangle.y),
        '" width="',
        utils.uint2str(_rectangle.width),
        '" height="',
        utils.uint2str(_rectangle.height),
        '" fill="',
        utils.getHslString(_rectangle.color),
        '">',
        animations,
        "</rect>"
      );
  }

  function linearGradient(string memory _stop1Color, string memory _stop2Color) internal pure returns (string memory) {
    return
      string.concat(
        '<linearGradient id="gradient">',
        '<stop offset="0%" stop-color="',
        _stop1Color,
        '"/>',
        '<stop offset="100%" stop-color="',
        _stop2Color,
        '"/>',
        "</linearGradient>"
      );
  }

  function getKaleidoscopeSVG(Kaleidoscope memory _kaleidoscope, ColorPalette memory _palette)
    public
    pure
    returns (string memory)
  {
    // Get outer artifacts
    string memory outerArtifacts = "";
    for (uint256 i = 0; i < _kaleidoscope.numOutsideArtifacts; i++) {
      // Rectangle
      AnimatedRectangle memory rectangle = rectangleAtIndexForKaleidescope(_kaleidoscope, _palette, i);
      outerArtifacts = string.concat(outerArtifacts, getRectangleSVG(rectangle));
    }

    string memory innerArtifacts = "";
    for (uint256 i = 0; i < _kaleidoscope.numInsideArtifacts; i++) {
      AnimatedCircle memory circle = circleAtIndexForKaleidescope(_kaleidoscope, _palette, i);
      innerArtifacts = string.concat(innerArtifacts, getCircleSVG(circle));
    }

    string memory paths = "";
    uint256 angleInterval = (360 * 10**7) / _kaleidoscope.repetitions;
    for (uint256 i = 0; i < _kaleidoscope.repetitions; i++) {
      paths = string.concat(
        paths,
        '<use href="#tile" transform="rotate(',
        utils.uint2floatstr(angleInterval * i, PRECISION_DEGREE),
        ",",
        utils.uint2floatstr(_kaleidoscope.centerX_precise, PRECISION_DEGREE),
        ",",
        utils.uint2floatstr(_kaleidoscope.centerY_precise, PRECISION_DEGREE),
        ')" />'
      );
    }

    string memory clipPath = string.concat(
      '<clipPath id="clip">',
      '<path d="M0,0L',
      utils.uint2floatstr(_kaleidoscope.centerX_precise, PRECISION_DEGREE),
      ",",
      utils.uint2floatstr(_kaleidoscope.centerY_precise, PRECISION_DEGREE),
      "L",
      utils.uint2floatstr(_kaleidoscope.centerX_precise * 2, PRECISION_DEGREE),
      ",0A",
      utils.uint2str(RADIUS),
      ",",
      utils.uint2str(RADIUS),
      ',0,0,0,0,0Z" />',
      "</clipPath>"
    );

    string memory svg = string.concat(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ',
      utils.uint2str(SIZE),
      " ",
      utils.uint2str(SIZE),
      '" width="',
      utils.uint2str(SIZE),
      '" height="',
      utils.uint2str(SIZE),
      '"><defs>',
      linearGradient(utils.getHslString(_palette.primaryColorHsl), utils.getHslString(_palette.darkerSecondaryHsl)),
      clipPath,
      '<g id="tile" clip-path="url(#clip)">',
      '<rect x="0" y="-',
      utils.uint2str(RADIUS),
      '" width="',
      utils.uint2str(RADIUS * 2),
      '" height="',
      utils.uint2str(RADIUS * 2),
      '" fill="'
    );

    svg = string.concat(
      svg,
      _kaleidoscope.hasGradient ? "url(#gradient)" : utils.getHslString(_palette.primaryColorHsl),
      '"></rect>',
      outerArtifacts,
      innerArtifacts,
      "</g>"
    );

    svg = string.concat(
      svg,
      "</defs>",
      '<rect width="',
      utils.uint2str(SIZE),
      '" height="',
      utils.uint2str(SIZE),
      '" fill="',
      utils.getHslString(_palette.backgroundColorHsl),
      '"></rect>',
      '<g id="kaleidoscopeTile" transform="translate(',
      utils.uint2str(SIZE / 2 - _kaleidoscope.centerX_precise / PRECISION)
      // "0"
    );

    svg = string.concat(
      svg,
      ",",
      utils.uint2str(SIZE / 2 - _kaleidoscope.centerY_precise / PRECISION),
      // "0",
      ')">',
      '<circle cx="',
      utils.uint2floatstr(_kaleidoscope.centerX_precise, PRECISION_DEGREE),
      '" cy="',
      utils.uint2floatstr(_kaleidoscope.centerY_precise, PRECISION_DEGREE),
      '" r="',
      utils.uint2str(RADIUS),
      '" fill="',
      utils.getHslString(_palette.primaryColorHsl),
      '" />',
      paths,
      "</g>",
      "</svg>"
    );

    return svg;
  }

  function render(uint256 _tokenId) public pure returns (string memory) {
    Kaleidoscope memory kaleidoscope = kaleidoscopeForTokenId(_tokenId);
    ColorPalette memory palette = colorPaletteForKaleidescope(kaleidoscope);
    string memory svg = getKaleidoscopeSVG(kaleidoscope, palette);

    return svg;
  }

  function metadata(uint256 _tokenId) public pure returns (Kaleidoscope memory) {
    Kaleidoscope memory kaleidoscope = kaleidoscopeForTokenId(_tokenId);
    return kaleidoscope;
  }
}
