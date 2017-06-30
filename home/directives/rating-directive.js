angular.module('ratingDirective', [])
  .directive('ratingDirective', function() {
    return {
      template: `
        <div>
          <span>Rating RateRate</span>
          <rating value="3" max="5"></rating>
          <p>Stars??</p>
        </div>`,
    };
  });