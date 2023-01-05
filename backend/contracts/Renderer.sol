//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// import "./Trigonometry.sol";
import "./Utilities.sol";

contract Renderer {
  uint256 constant SIZE = 500;
  uint256 constant RADIUS = 200;

  struct ColorPalette {
    uint256 primaryHue;
    uint256 secondaryHue;
    utils.HSL mainColorHsl;
    utils.HSL secondaryColorHsl;
    utils.HSL backgroundColor;
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
    uint256 duration;
  }

  function colorPaletteForKaleidescope(Kaleidoscope memory _kaleidoscope)
    public
    pure
    returns (ColorPalette memory palette)
  {
    palette.primaryHue = utils.randomRange(_kaleidoscope.tokenId, "primaryHue", 0, 360);
    palette.secondaryHue = _kaleidoscope.hasSecondaryColor ? (palette.primaryHue + 240) % 360 : palette.primaryHue;
    palette.mainColorHsl = utils.HSL(palette.primaryHue, 100, 30);
    palette.secondaryColorHsl = utils.HSL(palette.secondaryHue, 100, 70);
    palette.backgroundColor = utils.HSL(palette.primaryHue, 100, 10);
    palette.darkerSecondaryHsl = utils.HSL((palette.primaryHue + 10) % 360, 100, 10);
    palette.primaryColorsHsl = utils.generateColors(palette.primaryHue, _kaleidoscope.numInsideArtifacts + 1);
    palette.secondaryColorsHsl = utils.generateColors(palette.secondaryHue, _kaleidoscope.numInsideArtifacts + 1);

    return palette;
  }

  function kaleidoscopeForTokenId(uint256 _tokenId) public pure returns (Kaleidoscope memory kaleidoscope) {
    kaleidoscope.tokenId = _tokenId;
    kaleidoscope.repetitions = utils.randomRange(_tokenId, "repetitions", 3, 6);
    kaleidoscope.numInsideArtifacts = utils.randomRange(_tokenId, "numInsideArtifacts", 3, 10);
    kaleidoscope.numOutsideArtifacts = utils.randomRange(_tokenId, "numOutsideArtifacts", 1, 4);
    kaleidoscope.hasGradient = utils.randomRange(_tokenId, "hasGradient", 1, 10) == 5;
    kaleidoscope.hasSecondaryColor = utils.randomRange(_tokenId, "secondaryColor", 1, 8) == 8;

    return kaleidoscope;
  }

  function circleAtIndexForKaleidescope(
    Kaleidoscope memory _kaleidescope,
    ColorPalette memory _palette,
    uint256 _index
  ) public pure returns (AnimatedCircle memory circle) {
    circle.x1 = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("x1", utils.uint2str(_index)),
      0,
      _kaleidescope.centerX
    );
    circle.x2 = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("x2", utils.uint2str(_index)),
      circle.radius / 2,
      _kaleidescope.centerX
    );
    circle.y1 = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("y1", utils.uint2str(_index)),
      0,
      _kaleidescope.centerY
    );
    circle.y2 = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("y2", utils.uint2str(_index)),
      _kaleidescope.centerY,
      RADIUS
    );
    circle.radius = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("radius", utils.uint2str(_index)),
      5,
      RADIUS / 6
    );
    circle.duration = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("duration", utils.uint2str(_index)),
      5,
      10
    );
    circle.alternatingClass = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("alternatingClass", utils.uint2str(_index)),
      0,
      3
    );
    circle.color = _index % 2 == 0 ? _palette.primaryColorsHsl[_index] : _palette.secondaryColorsHsl[_index];

    return circle;
  }

  function rectangleAtIndexForKaleidescope(Kaleidoscope memory _kaleidescope, uint256 _index)
    public
    pure
    returns (AnimatedRectangle memory rectangle)
  {
    rectangle.width = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("width", utils.uint2str(_index)),
      RADIUS / 2,
      RADIUS
    );
    rectangle.height = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("height", utils.uint2str(_index)),
      RADIUS / 2,
      RADIUS
    );
    rectangle.duration = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("duration", utils.uint2str(_index)),
      5,
      10
    );

    return rectangle;
  }

  function triangleAtIndexForKaleidescope(Kaleidoscope memory _kaleidescope, uint256 _index)
    public
    pure
    returns (AnimatedTriangle memory triangle)
  {
    triangle.x1 = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("x1", utils.uint2str(_index)),
      0,
      _kaleidescope.centerX
    );
    triangle.y1 = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("y1", utils.uint2str(_index)),
      0,
      _kaleidescope.centerY
    );
    triangle.duration = utils.randomRange(
      _kaleidescope.tokenId,
      string.concat("duration", utils.uint2str(_index)),
      5,
      10
    );

    return triangle;
  }

  function getSVGForCircle(AnimatedCircle memory _circle) public pure returns (string memory) {
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
        utils.uint2str(_circle.radius / 2),
        '" cy="',
        utils.uint2str(_circle.radius / 2),
        '" r="',
        utils.uint2str(_circle.radius),
        '" fill="',
        "black",
        '">',
        animations,
        "</circle>"
      );
  }

  function render(uint256 _tokenId) public pure returns (string memory) {
    Kaleidoscope memory kaleidescope = kaleidoscopeForTokenId(_tokenId);
    ColorPalette memory palette = colorPaletteForKaleidescope(kaleidescope);

    AnimatedCircle memory circle = circleAtIndexForKaleidescope(kaleidescope, palette, 0);
    string memory circleSVG = getSVGForCircle(circle);

    string memory svg = string.concat(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ',
      utils.uint2str(SIZE),
      " ",
      utils.uint2str(SIZE),
      '">',
      circleSVG,
      "</svg>"
    );

    return svg;
  }
}
