//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./Trigonometry.sol";
import "./Utilities.sol";

contract Renderer {
  uint256 constant SIZE = 500;
  uint256 constant RADIUS = 200;

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
    uint256 repetitions; // n
    uint256 numInsideArtifacts; // numCircles
    uint256 numOutsideArtifacts;
    uint256 centerX;
    uint256 centerY;
    bool hasGradient;
    bool hasSecondaryColor;
  }

  struct AnimatedCircle {
    // Start position
    uint256 x1;
    uint256 y1;
    // End position
    uint256 x2;
    uint256 y2;
    uint256 radius;
    uint256 alternatingClass;
    uint256 duration;
    utils.HSL color;
  }

  struct AnimatedTriangle {
    uint256 x1;
    uint256 y1;
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
    kaleidoscope.centerX = uint256((int256(RADIUS) * Trigonometry.cos(angle)) / 1e18);
    kaleidoscope.centerY = uint256((int256(RADIUS) * Trigonometry.sin(angle)) / 1e18);

    return kaleidoscope;
  }

  function circleAtIndexForKaleidescope(
    Kaleidoscope memory _kaleidoscope,
    ColorPalette memory _palette,
    uint256 _index
  ) public pure returns (AnimatedCircle memory circle) {
    circle.x1 = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("circlex1", utils.uint2str(_index)),
      0,
      _kaleidoscope.centerX
    );
    circle.x2 = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("circlex2", utils.uint2str(_index)),
      0,
      _kaleidoscope.centerX
    );
    circle.y1 = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("circley1", utils.uint2str(_index)),
      0,
      _kaleidoscope.centerY
    );
    circle.y2 = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("circley2", utils.uint2str(_index)),
      _kaleidoscope.centerY,
      RADIUS
    );
    circle.radius = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("circleradius", utils.uint2str(_index)),
      5,
      RADIUS / 6
    );
    circle.duration = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("circleduration", utils.uint2str(_index)),
      5,
      10
    );
    circle.alternatingClass = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("circlealternatingClass", utils.uint2str(_index)),
      0,
      3
    );
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
      string.concat("width", utils.uint2str(_index)),
      RADIUS / 2,
      RADIUS
    );
    rectangle.height = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("height", utils.uint2str(_index)),
      RADIUS / 2,
      RADIUS
    );
    rectangle.x = 0;
    rectangle.y = _kaleidoscope.centerY;
    rectangle.duration = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("duration", utils.uint2str(_index)),
      5,
      10
    );
    rectangle.color = _index % 2 == 0 ? _palette.primaryColorsHsl[0] : _palette.secondaryColorsHsl[0];

    return rectangle;
  }

  function triangleAtIndexForKaleidescope(
    Kaleidoscope memory _kaleidoscope,
    ColorPalette memory _palette,
    uint256 _index
  ) public pure returns (AnimatedTriangle memory triangle) {
    triangle.x1 = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("x1", utils.uint2str(_index)),
      0,
      _kaleidoscope.centerX
    );
    triangle.y1 = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("y1", utils.uint2str(_index)),
      0,
      _kaleidoscope.centerY
    );
    triangle.duration = utils.randomRange(
      _kaleidoscope.tokenId,
      string.concat("duration", utils.uint2str(_index)),
      5,
      10
    );
    triangle.color = _index % 2 == 0 ? _palette.primaryColorsHsl[0] : _palette.secondaryColorsHsl[0];

    return triangle;
  }

  function getCircleSVG(AnimatedCircle memory _circle) public pure returns (string memory) {
    string memory animations = "";

    if (_circle.alternatingClass >= 2) {
      animations = _circle.alternatingClass == 3
        ? string.concat(
          '<animate attributeName="cx" values="',
          utils.uint2str(_circle.x1),
          ";",
          utils.uint2str(_circle.x2),
          ";",
          utils.uint2str(_circle.x1),
          '" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="',
          utils.uint2str(_circle.duration),
          's" repeatCount="indefinite"/>'
        )
        : string.concat(
          '<animate attributeName="cy" values="',
          utils.uint2str(_circle.y1),
          ";",
          utils.uint2str(_circle.y2),
          ";",
          utils.uint2str(_circle.y1),
          '" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="',
          utils.uint2str(_circle.duration / 2),
          's" repeatCount="indefinite"/>'
        );
    } else {
      animations = string.concat(
        '<animate attributeName="cx" values="',
        utils.uint2str(_circle.x1),
        ";",
        utils.uint2str(_circle.x2),
        ";",
        utils.uint2str(_circle.x1),
        '" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="',
        utils.uint2str(_circle.duration),
        's" repeatCount="indefinite"/>',
        '<animate attributeName="cy" values="',
        utils.uint2str(_circle.y1),
        ";",
        utils.uint2str(_circle.y2),
        ";",
        utils.uint2str(_circle.y1),
        '" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="',
        utils.uint2str(_circle.duration / 2),
        's" repeatCount="indefinite"/>'
      );
    }

    return
      string.concat(
        '<circle cx="',
        utils.uint2str(RADIUS / 2),
        '" cy="',
        utils.uint2str(RADIUS / 2),
        '" r="',
        utils.uint2str(_circle.radius),
        '" fill="',
        utils.getHslString(_circle.color),
        '">',
        animations,
        "</circle>"
      );
  }

  function getTriangleSVG(AnimatedTriangle memory _triangle) public pure returns (string memory) {
    uint256 x2 = _triangle.x1 + RADIUS;
    uint256 y2 = _triangle.y1;

    string memory animations = string.concat(
      '<animateTransform attributeName="transform" type="rotate" from="0 ',
      utils.uint2str(_triangle.x1),
      " -",
      utils.uint2str(_triangle.y1),
      '" to="360 ',
      utils.uint2str(_triangle.x1),
      " -",
      utils.uint2str(_triangle.y1),
      '" begin="0s" dur="',
      utils.uint2str(_triangle.duration),
      's" repeatCount="indefinite" />'
    );

    return
      string.concat(
        '<polygon points="0,-',
        utils.uint2str(_triangle.y1),
        " ",
        utils.uint2str(x2),
        ",",
        utils.uint2str(y2),
        " ",
        utils.uint2str(_triangle.x1),
        ",",
        utils.uint2str(y2),
        '" fill="',
        utils.getHslString(_triangle.color),
        '">',
        animations,
        "</polygon>"
      );
  }

  function getRectangleSVG(AnimatedRectangle memory _rectangle) public pure returns (string memory) {
    string memory animations = string.concat(
      '<animateTransform attributeName="transform" type="rotate" from="0 0 -',
      utils.uint2str(_rectangle.y),
      '" to="360 0 -',
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
      bool isTriangle = utils.randomRange(
        _kaleidoscope.tokenId,
        string.concat("isTriangle", utils.uint2str(i)),
        1,
        10
      ) %
        2 ==
        0;
      if (isTriangle) {
        AnimatedTriangle memory triangle = triangleAtIndexForKaleidescope(_kaleidoscope, _palette, i);
        outerArtifacts = string.concat(outerArtifacts, getTriangleSVG(triangle));
      } else {
        // Rectangle
        AnimatedRectangle memory rectangle = rectangleAtIndexForKaleidescope(_kaleidoscope, _palette, i);
        outerArtifacts = string.concat(outerArtifacts, getRectangleSVG(rectangle));
      }
    }

    string memory innerArtifacts = "";
    for (uint256 i = 0; i < _kaleidoscope.numInsideArtifacts; i++) {
      AnimatedCircle memory circle = circleAtIndexForKaleidescope(_kaleidoscope, _palette, i);
      innerArtifacts = string.concat(innerArtifacts, getCircleSVG(circle));
    }

    string memory paths = "";
    uint256 angleInterval = 360 / _kaleidoscope.repetitions;
    for (uint256 i = 0; i <= _kaleidoscope.repetitions; i++) {
      paths = string.concat(
        paths,
        '<use href="#tile" transform="rotate(',
        utils.uint2str(angleInterval * i),
        ",",
        utils.uint2str(_kaleidoscope.centerX),
        ",",
        utils.uint2str(_kaleidoscope.centerY),
        ')" />'
      );
    }

    string memory clipPath = string.concat(
      // `M0,0L${x},${y}L${x * 2},0A${r},${r},0,0,0,0,0Z`
      '<clipPath id="clip">',
      '<path d="M0,0L',
      utils.uint2str(_kaleidoscope.centerX),
      ",",
      utils.uint2str(_kaleidoscope.centerY),
      "L",
      utils.uint2str(_kaleidoscope.centerX * 2),
      ",0A",
      utils.uint2str(RADIUS),
      ",",
      utils.uint2str(RADIUS),
      ',0,0,0,0,0Z"',
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
      utils.uint2str(SIZE / 2 - _kaleidoscope.centerX)
      // "0"
    );

    svg = string.concat(
      svg,
      ",",
      utils.uint2str(SIZE / 2 - _kaleidoscope.centerY),
      // "0",
      ')">',
      '<circle cx="',
      utils.uint2str(_kaleidoscope.centerX),
      '" cy="',
      utils.uint2str(_kaleidoscope.centerY),
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
}
