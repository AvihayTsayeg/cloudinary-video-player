import videojs from 'video.js';
import './cloudinary-button.scss';

// support VJS5 & VJS6 at the same time
const dom = videojs.dom || videojs;
const Component = videojs.getComponent('Component');
const ClickableComponent = videojs.getComponent('ClickableComponent');

class CloudinaryButton extends ClickableComponent {
  constructor(player, options) {
    super(player, options);

    const clickOutsideHandler = (e) => {
      const isClickInside = player.el().querySelector('.vjs-cloudinary-tooltip').contains(e.target);
      const toggleButtonClicked = player.el().querySelector('.vjs-cloudinary-button') === e.target;
      if (!isClickInside && !toggleButtonClicked) {
        player.removeClass('vjs-cloudinary-tooltip-show');
      }
    };
    window.addEventListener('click', clickOutsideHandler);

    player.addChild('cloudinaryTooltip');
  }

  toggleTooltip() {
    if (!this.player().hasClass('vjs-cloudinary-tooltip-show')) {
      this.player().trigger('cld-get-info');
    }
    this.player().toggleClass('vjs-cloudinary-tooltip-show');
  }

  handleClick(event) {
    super.handleClick(event);
    this.toggleTooltip();
  }

  // The `createEl` function of a component creates its DOM element.
  createEl() {
    return videojs.createEl('button', {
      className: 'vjs-control vjs-cloudinary-button vjs-button'
    });
  }
}

class CloudinaryTooltip extends Component {
  createEl() {
    const tooltip = super.createEl('div', {
      className: 'vjs-cloudinary-tooltip'
    });

    const logo = dom.createEl('a', {
      className: 'vjs-cloudinary-tooltip-header',
      href: 'https://cloudinary.com/solutions/video_management',
      target: '_blank',
      innerHTML: 'Powered By <span class="logo"></span>'
    });
    tooltip.appendChild(logo);

    const fieldsWrpEl = dom.createEl('div', {
      className: 'vjs-cloudinary-tooltip-data-field',
      innerHTML: '<span class="label">Video ID</span><span class="value">asFgS74o8631fh5</span>'
    });
    tooltip.appendChild(fieldsWrpEl);

    const getInfo = () => {
      const fieldsWrp = tooltip.querySelector('.vjs-cloudinary-tooltip-data-field');
      fieldsWrp.innerHTML = '';

      let w = this.player().videoWidth();
      let h = this.player().videoHeight();
      let info = {
        'Video ID': this.player().cloudinary.currentPublicId(),
        'Dimensions': w + ' X ' + h,
        'Buffered': parseInt(this.player().bufferedPercent() * 100, 0) + '%',
        'Volume': parseInt(this.player().volume() * 100, 0) + '%'
      };

      for (const prop in info) {
        if (Object.prototype.hasOwnProperty.call(info, prop)) {
          const field = dom.createEl('div', {
            className: 'vjs-cloudinary-tooltip-data-field',
            innerHTML: '<span class="label">' + prop + '</span><span class="value">' + info[prop] + '</span>'
          });
          fieldsWrp.appendChild(field);
        }
      }

    };

    this.player().on('cld-get-info', getInfo);
    this.player().on('loadedmetadata', getInfo);
    return tooltip;
  }
}


class CloudinaryTooltipCloseButton extends ClickableComponent {
  handleClick(event) {
    super.handleClick(event);
    this.player().removeClass('vjs-cloudinary-tooltip-show');
  }

  createEl() {
    return videojs.createEl('button', {
      className: 'vjs-control vjs-cloudinary-tooltip-close-button'
    });
  }
}

videojs.registerComponent('cloudinaryTooltipCloseButton', CloudinaryTooltipCloseButton);
videojs.registerComponent('cloudinaryButton', CloudinaryButton);
videojs.registerComponent('cloudinaryTooltip', CloudinaryTooltip);
CloudinaryTooltip.prototype.options_ = { children: ['CloudinaryTooltipCloseButton'] };

export default CloudinaryButton;